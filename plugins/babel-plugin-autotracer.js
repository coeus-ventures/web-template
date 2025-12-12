module.exports = function autoTracerPlugin({ types: t }, options = {}) {
  const onlyPatterns = options.only || ['/behaviors/'];

  function matchesPattern(filename, patterns) {
    return patterns.some(pattern => {
      if (pattern.includes('**')) {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\//g, '[\\\\/]'));
        return regex.test(filename);
      }
      return filename.includes(pattern);
    });
  }

  function shouldSkipFile(filename) {
    if (!filename) return true;
    const normalized = filename.replace(/\\/g, '/');
    if (normalized.includes('node_modules')) return true;
    if (normalized.includes('.next')) return true;
    if (!matchesPattern(normalized, onlyPatterns)) return true;
    return false;
  }

  function getCalleeName(node) {
    if (t.isIdentifier(node)) return node.name;
    if (t.isMemberExpression(node)) {
      const obj = t.isIdentifier(node.object) ? node.object.name : 'expr';
      const prop = t.isIdentifier(node.property) ? node.property.name : 'computed';
      return `${obj}.${prop}`;
    }
    return 'anonymous';
  }

  function getCallerName(path) {
    let current = path.parentPath;
    while (current) {
      if (current.isFunctionDeclaration() && current.node.id) return current.node.id.name;
      if (current.isFunctionExpression() && current.node.id) return current.node.id.name;
      if (current.isArrowFunctionExpression()) {
        const parent = current.parentPath;
        if (parent && parent.isVariableDeclarator() && t.isIdentifier(parent.node.id)) return parent.node.id.name;
        return '<arrow>';
      }
      if ((current.isClassMethod() || current.isObjectMethod()) && t.isIdentifier(current.node.key)) return current.node.key.name;
      current = current.parentPath;
    }
    return '<module>';
  }

  function hasSideEffects(node, depth = 0) {
    if (!node) return false;
    if (depth > 4) return false;
    if (t.isUpdateExpression(node)) return true; // i++
    if (t.isAssignmentExpression(node)) return true; // a = 1
    if (t.isCallExpression(node)) return true; // fn()
    if (t.isNewExpression(node)) return true;
    if (t.isAwaitExpression(node)) return true;
    if (t.isYieldExpression(node)) return true;
    
    if (t.isConditionalExpression(node)) return hasSideEffects(node.test, depth + 1) || hasSideEffects(node.consequent, depth + 1) || hasSideEffects(node.alternate, depth + 1);
    if (t.isLogicalExpression(node) || t.isBinaryExpression(node)) return hasSideEffects(node.left, depth + 1) || hasSideEffects(node.right, depth + 1);
    if (t.isUnaryExpression(node)) {
      if (node.operator === 'delete') return true;
      return hasSideEffects(node.argument, depth + 1);
    }
    
    if (t.isArrayExpression(node)) return node.elements.some(el => el && hasSideEffects(el, depth + 1));
    if (t.isObjectExpression(node)) {
      return node.properties.some(prop => {
         if (t.isObjectProperty(prop)) return hasSideEffects(prop.value, depth + 1) || (prop.computed && hasSideEffects(prop.key, depth + 1));
         if (t.isSpreadElement(prop)) return hasSideEffects(prop.argument, depth + 1);
         return false;
      });
    }
    return false;
  }

  function extractBehaveMetadata(filePath) {
    const normalized = filePath.replace(/\\/g, '/');
    const behaviorMatch = normalized.match(/behaviors\/([^/]+)/);
    const behavior = behaviorMatch ? behaviorMatch[1] : null;

    let layer = 'unknown';
    if (normalized.includes('.action.')) layer = 'server-action';
    else if (normalized.match(/use-[^/]+\.(ts|tsx|js|jsx)$/)) layer = 'hook';
    else if (normalized.includes('/components/')) layer = 'component';
    
    return { behavior, layer };
  }

  function shouldTraceCall(node) {
    const callee = node.callee;
    if (t.isIdentifier(callee) && callee.name === '__autotracer_write') return false;
    if (t.isImport(callee)) return false;
    if (t.isIdentifier(callee) && callee.name === 'require') return false;
    if (t.isMemberExpression(callee) && t.isIdentifier(callee.object) && callee.object.name === 'console') return false;
    if (t.isSuper(callee)) return false;
    if (t.isMemberExpression(callee) || t.isIdentifier(callee)) return true;
    return false;
  }

  return {
    name: 'autotracer',
    visitor: {
      Program(path, state) {
        const filename = state.filename || state.file?.opts?.filename || '';
        if (shouldSkipFile(filename)) return;

        const normalized = filename.replace(/\\/g, '/');
        state.relativePath = normalized;

        let hasImport = false;
        path.traverse({
          ImportDeclaration(importPath) {
            if (importPath.node.source.value === '@autotracer/runtime') hasImport = true;
          }
        });

        if (!hasImport) {
          const importDeclaration = t.importDeclaration(
            [t.importSpecifier(t.identifier('__autotracer_write'), t.identifier('__autotracer_write'))],
            t.stringLiteral('@autotracer/runtime')
          );
          path.node.body.unshift(importDeclaration);
        }
      },

      CallExpression(callPath, state) {
        if (!state.relativePath) return;
        
        // Verifica flag para evitar loop infinito
        if (callPath.node._autoTracerSkip) return;
        
        if (!shouldTraceCall(callPath.node)) return;

        const callExpr = callPath.node;
        const line = callExpr.loc ? callExpr.loc.start.line : 0;
        const calleeName = getCalleeName(callExpr.callee);
        const callerName = getCallerName(callPath);
        const { behavior, layer } = extractBehaveMetadata(state.relativePath);

        const hoisted = [];
        const processedArgs = []; // Argumentos para a execução real
        const argIdentifiers = []; // Argumentos para o log (JSON)

        callExpr.arguments.forEach((arg, idx) => {
          // Se tiver side-effect, extraímos para variável temporária
          if (hasSideEffects(arg)) {
            const tempId = callPath.scope.generateUidIdentifier(`_arg${idx}`);
            // Deep clone no argumento original para a declaração da variável
            hoisted.push(t.variableDeclaration('const', [t.variableDeclarator(tempId, t.cloneNode(arg, true))]));
            
            processedArgs.push(tempId);
            argIdentifiers.push(t.cloneNode(tempId));
          } else {
            processedArgs.push(t.cloneNode(arg, true)); 
            argIdentifiers.push(t.cloneNode(arg, true));
          }
        });

        const newCall = t.callExpression(callExpr.callee, processedArgs);
        newCall._autoTracerSkip = true;

        const metadata = t.objectExpression([
          t.objectProperty(t.identifier('timestamp'), t.callExpression(
            t.memberExpression(t.newExpression(t.identifier('Date'), []), t.identifier('toISOString')), 
            []
          )),
          t.objectProperty(t.identifier('file'), t.stringLiteral(state.relativePath)),
          t.objectProperty(t.identifier('line'), t.numericLiteral(line)),
          t.objectProperty(t.identifier('function'), t.stringLiteral(calleeName)),
          t.objectProperty(t.identifier('caller'), t.stringLiteral(callerName)),
          t.objectProperty(t.identifier('behavior'), behavior ? t.stringLiteral(behavior) : t.nullLiteral()),
          t.objectProperty(t.identifier('layer'), t.stringLiteral(layer)),
          t.objectProperty(t.identifier('params'), t.objectExpression(
            argIdentifiers.map((arg, i) => t.objectProperty(t.stringLiteral(String(i)), arg))
          )),
          t.objectProperty(t.identifier('code'), t.stringLiteral(`${calleeName}(...)`))
        ]);

        const tracerCall = t.callExpression(t.identifier('__autotracer_write'), [metadata]);
        tracerCall._autoTracerSkip = true;

        const sequenceExpr = t.sequenceExpression([tracerCall, newCall]);
        sequenceExpr._autoTracerSkip = true;

        const statementPath = callPath.getStatementParent();
        if (statementPath && hoisted.length > 0) {
          hoisted.forEach(decl => statementPath.insertBefore(decl));
        }

        callPath.replaceWith(sequenceExpr);
        
        callPath.skip(); 
      }
    }
  };
};