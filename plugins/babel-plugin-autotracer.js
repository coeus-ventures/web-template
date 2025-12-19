/**
 * Babel Plugin AutoTracer - Versão Mínima
 * 
 * Fluxo:
 * 1. Arquivo é do cliente (/behaviors/ ou /playground/)? Sim -> continua
 * 2. Função não é de biblioteca? Sim -> injeta __trace()
 * 3. Fim.
 */

module.exports = function autoTracerPlugin({ types: t }) {
  
  function isClientFile(filename) {
    if (!filename) return false;
    const normalized = filename.replace(/\\/g, '/');
    
    if (normalized.includes('node_modules')) return false;
    if (normalized.includes('.next')) return false;
    
    return normalized.includes('/behaviors/') || normalized.includes('/playground/');
  }

  function isLibraryFunction(name) {
    if (name.length <= 3) return true;
    
    if (name.startsWith('_')) return true;
    
    const blocked = [
      'useEffect', 'useState', 'useCallback', 'useMemo', 'useRef',
      'useContext', 'useReducer', 'useLayoutEffect', 'useId',
      'useTransition', 'useDeferredValue', 'useActionState',
      'render', 'hydrate', 'createElement', 'forwardRef', 'memo', 'lazy',
      'clsx', 'twMerge', 'classNames'
    ];
    
    return blocked.includes(name);
  }

  /**
   * Cria: __trace("funcName", { args }, new Error().stack)
   */
  function createLogStatement(functionName, params) {
    const paramNames = params
      .filter(p => t.isIdentifier(p))
      .map(p => p.name);
    
    const argsObject = t.objectExpression(
      paramNames.map(name => 
        t.objectProperty(t.identifier(name), t.identifier(name), false, true)
      )
    );
    
    const stackExpr = t.memberExpression(
      t.newExpression(t.identifier('Error'), []),
      t.identifier('stack')
    );
    
    return t.expressionStatement(
      t.callExpression(
        t.identifier('__trace'),
        [t.stringLiteral(functionName), argsObject, stackExpr]
      )
    );
  }

  /**
   * Injeta log no início da função
   */
  function injectLog(path, functionName) {
    if (path.node._traced) return;
    path.node._traced = true;
    
    const body = path.node.body;
    
    // Arrow function sem bloco
    if (!t.isBlockStatement(body)) {
      path.node.body = t.blockStatement([
        createLogStatement(functionName, path.node.params),
        t.returnStatement(body)
      ]);
      return;
    }
    
    body.body.unshift(createLogStatement(functionName, path.node.params));
  }

  return {
    name: 'autotracer',
    
    visitor: {
      Program(path, state) {
        const filename = state.filename || '';
        if (!isClientFile(filename)) {
          path.stop();
          return;
        }
        
        path.node.body.unshift(
          t.importDeclaration(
            [t.importSpecifier(t.identifier('__trace'), t.identifier('__trace'))],
            t.stringLiteral('@/lib/autotracer')
          )
        );
      },

      FunctionDeclaration(path) {
        const name = path.node.id?.name;
        if (!name || isLibraryFunction(name)) return;
        injectLog(path, name);
      },

      VariableDeclarator(path) {
        const { id, init } = path.node;
        if (!t.isIdentifier(id)) return;
        if (!t.isArrowFunctionExpression(init) && !t.isFunctionExpression(init)) return;
        if (isLibraryFunction(id.name)) return;
        
        injectLog(path.get('init'), id.name);
      }
    }
  };
};
