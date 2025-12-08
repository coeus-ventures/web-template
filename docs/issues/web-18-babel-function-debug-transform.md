# WEB-18 Babel Function Debug Transform

Add a custom Babel plugin that automatically injects `console.debug()` statements at the beginning of every function. This enables function-level tracing for debugging purposes during development.

# Functional Specification

## Behavior: Function Debug Logging

This transformation adds `console.debug('[filename:line] functionName()')` as the first statement in every function body, providing automatic tracing of function calls during development.

### Target Functions

The transform should handle all function types:
- Function declarations: `function foo() {}`
- Function expressions: `const foo = function() {}`
- Arrow functions with block body: `const foo = () => {}`
- Object methods: `{ foo() {} }`
- Class methods: `class Foo { bar() {} }`
- Async functions: `async function foo() {}`
- Generator functions: `function* foo() {}`

### Output Format

```javascript
// Input
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Output
function calculateTotal(items) {
  console.debug('[utils.ts:1] calculateTotal()');
  return items.reduce((sum, item) => {
    console.debug('[utils.ts:2] anonymous()');
    return sum + item.price;
  }, 0);
}
```

### Exclusions

The transform should NOT inject console.debug into:
- Files in `node_modules/`
- Files matching `*.test.ts`, `*.spec.ts`, `*.test.tsx`, `*.spec.tsx`
- Functions that already have `console.debug` as the first statement
- Arrow functions with expression body (no block): `const add = (a, b) => a + b`

# Technical Specification

## Babel Configuration

File: `babel.config.js`

Root-level Babel configuration file that Next.js 16+ Turbopack will automatically detect and use.

### Configuration

```javascript
module.exports = {
  plugins: [
    process.env.NODE_ENV === 'development' && './babel-plugins/function-debug-transform',
  ].filter(Boolean),
};
```

---

## Plugin: function-debug-transform

File: `babel-plugins/function-debug-transform.js`

Custom Babel plugin that traverses the AST and injects console.debug statements.

### Plugin Structure

```javascript
module.exports = function({ types: t }) {
  return {
    visitor: {
      // Handle function declarations, expressions, arrow functions, methods
    }
  };
};
```

### Implementation Details

* Uses `@babel/types` to construct AST nodes
* Extracts filename from `state.filename`
* Gets line number from `path.node.loc.start.line`
* Determines function name from:
  - Function declaration: `path.node.id.name`
  - Variable declarator parent: `path.parent.id.name`
  - Object/class method: `path.node.key.name`
  - Fallback: `'anonymous'`
* Constructs console.debug call expression:
  ```javascript
  t.expressionStatement(
    t.callExpression(
      t.memberExpression(t.identifier('console'), t.identifier('debug')),
      [t.stringLiteral(`[${filename}:${line}] ${funcName}()`)]
    )
  )
  ```
* Skips if first statement is already console.debug
* Skips arrow functions without block body

### Visitor Methods

| Visitor | Purpose |
|---------|---------|
| `FunctionDeclaration` | Named function declarations |
| `FunctionExpression` | Anonymous function expressions |
| `ArrowFunctionExpression` | Arrow functions (block body only) |
| `ClassMethod` | Class instance and static methods |
| `ObjectMethod` | Object literal methods |

---

## Plugin Options (Optional Enhancement)

File: `babel-plugins/function-debug-transform.js`

Support configuration via babel.config.js:

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['./babel-plugins/function-debug-transform', {
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
      include: ['app/**/*', 'lib/**/*'],
      format: '[{filename}:{line}] {name}()',
      method: 'debug', // debug | log | trace
    }]
  ],
};
```

### Option Defaults

| Option | Default | Description |
|--------|---------|-------------|
| `exclude` | `['**/*.test.*', '**/*.spec.*']` | Glob patterns to skip |
| `include` | `['**/*']` | Glob patterns to include |
| `format` | `'[{filename}:{line}] {name}()'` | Output format template |
| `method` | `'debug'` | Console method to use |

---

## Environment Control

The plugin should only run in development:

### Via babel.config.js

```javascript
module.exports = {
  plugins: [
    process.env.NODE_ENV === 'development' && './babel-plugins/function-debug-transform',
  ].filter(Boolean),
};
```

### Via env preset

```javascript
module.exports = {
  env: {
    development: {
      plugins: ['./babel-plugins/function-debug-transform'],
    },
  },
};
```

# Tasks

Implementation tasks for this feature:

* [ ] Create `babel-plugins/` directory
* [ ] Implement `function-debug-transform.js` plugin
  * [ ] Handle FunctionDeclaration
  * [ ] Handle FunctionExpression
  * [ ] Handle ArrowFunctionExpression (block body)
  * [ ] Handle ClassMethod
  * [ ] Handle ObjectMethod
  * [ ] Extract filename and line number
  * [ ] Determine function name with fallbacks
  * [ ] Skip already-instrumented functions
* [ ] Create `babel.config.js` with development-only plugin
* [ ] Add plugin tests
  * [ ] Test each function type transformation
  * [ ] Test exclusion logic
  * [ ] Test filename/line extraction
* [ ] Add `.gitignore` entry for any generated files
* [ ] Document usage in README or separate doc
* [ ] Verify Turbopack detects and uses the config

# Notes

## Turbopack + Babel Behavior

- Next.js 16+ Turbopack automatically detects `babel.config.js` or `.babelrc`
- SWC still handles Next.js internal transforms (JSX, TypeScript, etc.)
- Babel runs as an additional transform step
- `node_modules` are excluded by default unless manually configured

## Performance Considerations

- This transform adds overhead in development
- Console.debug calls can be filtered in browser DevTools
- Consider adding a runtime flag to disable output without removing transforms

## Alternative Approaches

1. **SWC Plugin**: Would be faster but requires Rust knowledge and SWC plugin API
2. **Vite Plugin**: Only works with Vite, not Next.js Turbopack
3. **TypeScript Transformer**: Requires custom build setup
4. **Proxy-based runtime**: Doesn't provide static analysis benefits

## Future Enhancements

- Add function arguments to debug output
- Add execution timing
- Support source maps for accurate line numbers
- Add filtering by function name pattern
- Support custom logging functions (not just console.debug)
