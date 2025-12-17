module.exports = function autoTracerPlugin({ types: t }, options = {}) {
  const onlyPatterns = options.only || ['/app/', '/src/', '/shared/', '/lib/'];
  const blockPatterns = options.block || ['node_modules', '.next', 'react'];

  function matchesPattern(filename, patterns) {
    return patterns.some(pattern => {
      if (pattern.includes('**')) {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\//g, '[\\\\/]'));
        return regex.test(filename);
      }
      return filename.includes(pattern);
    });
  }

  function isBlockedFile(filename) {
    if (!filename) return true;
    const normalized = filename.replace(/\\/g, '/');
    if (matchesPattern(normalized, blockPatterns)) return true;
    if (!matchesPattern(normalized, onlyPatterns)) return true;
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

  function getCallerName(path) {
    let current = path.parentPath;
    while (current) {
      if (current.isFunctionDeclaration() && current.node.id) return current.node.id.name;
      if (current.isFunctionExpression() && current.node.id) return current.node.id.name;
      if (current.isArrowFunctionExpression()) {
        const parent = current.parentPath;
        if (parent && parent.isVariableDeclarator() && t.isIdentifier(parent.node.id)) return parent.node.id.name;
      }
      if ((current.isClassMethod() || current.isObjectMethod()) && t.isIdentifier(current.node.key)) return current.node.key.name;
      current = current.parentPath;
    }
    return null;
  }

  function injectFunctionEntry(functionNode, functionName, filePath) {
    const line = functionNode.loc ? functionNode.loc.start.line : 0;

    // Montar objeto de metadados
    const metadata = [
      t.objectProperty(t.identifier('functionName'), t.stringLiteral(functionName)),
      t.objectProperty(t.identifier('file'), t.stringLiteral(filePath)),
      t.objectProperty(t.identifier('line'), t.numericLiteral(line)),
      t.objectProperty(t.identifier('isEntry'), t.booleanLiteral(true))
    ];

    const entryLog = t.expressionStatement(
      t.callExpression(t.identifier('__autotracer_write'), [
        t.objectExpression(metadata)
      ])
    );
    entryLog._autoTracerSkip = true;
    return entryLog;
  }

  return {
    name: 'autotracer',
    visitor: {
      Program(path, state) {
        const filename = state.filename || state.file?.opts?.filename || '';
        if (isBlockedFile(filename)) return;

        const normalized = filename.replace(/\\/g, '/');
        state.relativePath = normalized;

        // Injetar import
        let hasImport = false;
        path.traverse({
          ImportDeclaration(importPath) {
            if (importPath.node.source.value === '@/lib/autotracer-runtime') {
              hasImport = true;
            }
          }
        });

        if (!hasImport) {
          const importDeclaration = t.importDeclaration(
            [t.importSpecifier(t.identifier('__autotracer_write'), t.identifier('__autotracer_write'))],
            t.stringLiteral('@/lib/autotracer-runtime')
          );
          path.node.body.unshift(importDeclaration);
        }
      },

      // Instrumenta declarations (não call sites)
      FunctionDeclaration(path, state) {
        if (!state.relativePath) return;
        if (path.node._autoTracerSkip) return;

        const functionName = path.node.id?.name;
        if (!functionName) return;

        const entryLog = injectFunctionEntry(path.node, functionName, state.relativePath);
        
        path.node.body.body.unshift(entryLog);
      },

      VariableDeclarator(path, state) {
        if (!state.relativePath) return;
        if (path.node._autoTracerSkip) return;

        const { id, init } = path.node;
        
        // export const useHello = () => {...} ou const hello = async () => {...}
        if (!t.isIdentifier(id)) return;
        if (!init || (!t.isArrowFunctionExpression(init) && !t.isFunctionExpression(init))) return;

        const functionName = id.name;

        // Se arrow function não tem bloco, converte
        if (t.isArrowFunctionExpression(init) && !t.isBlockStatement(init.body)) {
          init.body = t.blockStatement([t.returnStatement(init.body)]);
        }

        const entryLog = injectFunctionEntry(init, functionName, state.relativePath);
        
        if (t.isBlockStatement(init.body)) {
          init.body.body.unshift(entryLog);
        }
      },

      // Log call sites com caller info
      CallExpression(callPath, state) {
        if (!state.relativePath) return;
        if (callPath.node._autoTracerSkip) return;

        const callExpr = callPath.node;

        // Não traçar __autotracer_write, imports, requires, console
        if (t.isIdentifier(callExpr.callee) && callExpr.callee.name === '__autotracer_write') return;
        if (t.isImport(callExpr.callee)) return;
        if (t.isIdentifier(callExpr.callee) && callExpr.callee.name === 'require') return;
        if (t.isMemberExpression(callExpr.callee) && t.isIdentifier(callExpr.callee.object) && callExpr.callee.object.name === 'console') return;

        // Extrair nome da função sendo chamada
        let functionName = '?';
        let objectName = null;
        
        if (t.isIdentifier(callExpr.callee)) {
          functionName = callExpr.callee.name;
        } else if (t.isMemberExpression(callExpr.callee)) {
          objectName = t.isIdentifier(callExpr.callee.object) ? callExpr.callee.object.name : null;
          const prop = t.isIdentifier(callExpr.callee.property) ? callExpr.callee.property.name : '?';
          
          // BLOQUEAR IMEDIATAMENTE: Schema, formData, ou métodos de parsing
          if (objectName && (objectName.endsWith('Schema') || objectName === 'formData')) return;
          if (['safeParse', 'parse', 'get', 'set', 'has', 'delete', 'append'].includes(prop)) return;
          
          functionName = `${objectName || '?'}.${prop}`;
        }

        // BLOCKLIST: bibliotecas e nativas
        const blocklist = /^(z\.|Date\.|JSON\.|Math\.|Object\.|Array\.|String\.|Number\.|Boolean\.|Promise\.|console\.|setTimeout|setInterval|setImmediate|clearTimeout|clearInterval|clearImmediate|useCallback|useEffect|useContext|useRef|useMemo|useLayoutEffect|useInsertionEffect|useId|useSyncExternalStore|useTransition|useDeferredValue|useOptimistic|\?\.)/.test(functionName);
        if (blocklist) return;

        const line = callExpr.loc ? callExpr.loc.start.line : 0;
        const callerName = getCallerName(callPath);

        const metadata = [
          t.objectProperty(t.identifier('functionName'), t.stringLiteral(functionName)),
          t.objectProperty(t.identifier('file'), t.stringLiteral(state.relativePath)),
          t.objectProperty(t.identifier('line'), t.numericLiteral(line)),
          t.objectProperty(t.identifier('isEntry'), t.booleanLiteral(false))
        ];

        // Adicionar caller se disponível
        if (callerName) {
          metadata.push(t.objectProperty(t.identifier('caller'), t.stringLiteral(callerName)));
        }

        const tracerCall = t.callExpression(t.identifier('__autotracer_write'), [
          t.objectExpression(metadata)
        ]);
        tracerCall._autoTracerSkip = true;

        const clonedCall = t.cloneNode(callExpr, false, false);
        clonedCall._autoTracerSkip = true;

        const sequenceExpr = t.sequenceExpression([tracerCall, clonedCall]);
        sequenceExpr._autoTracerSkip = true;

        callPath.replaceWith(sequenceExpr);
        callPath.skip();
      }
    }
  };
};