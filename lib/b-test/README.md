# BTest

LLM-powered browser testing utilities with HTML snapshot capture and natural language assertions.

## Tester

A Playwright-based testing service that captures HTML snapshots and uses LLM-powered assertions to verify page conditions.

### Features

- **HTML Snapshots**: Capture full page HTML content with timestamps
- **LLM Assertions**: Use natural language to assert conditions on page content
- **Snapshot Comparison**: Generate structured diffs between page states
- **Polling with Conditions**: Wait for conditions to be met with intelligent polling
- **In-Memory Storage**: Snapshots are stored only during test execution

### Basic Usage

```typescript
import { chromium } from 'playwright';
import { Tester } from '@/lib/b-test';

const browser = await chromium.launch();
const page = await browser.newPage();
const tester = new Tester(page);

// Navigate to your page
await page.goto('https://example.com');

// Take a snapshot
const { snapshotId } = await tester.snapshot();

// Assert conditions using natural language
const hasTitle = await tester.assert('page has a title element');
const hasLoginButton = await tester.assert('login button is visible');

// Compare current page state with stored snapshot
await page.click('button'); // make some change
const diff = await tester.diff(); // compares stored snapshot with current page state

// Assert based on changes
const buttonWasClicked = await tester.assert('button click resulted in visible changes');

// Wait for conditions
await tester.waitFor('loading spinner is not visible', 10000);
```

### API Reference

#### `snapshot(page?: Page)`
Captures current page HTML content.

- **Returns**: `{ success: boolean, snapshotId: string }`
- **Storage**: Stored as `currentSnapshot`, `beforeSnapshot`, or `afterSnapshot`

#### `assert(condition: string)`
Uses LLM to evaluate a condition by comparing stored snapshot with current page state.

- **Parameters**: `condition` - Natural language description
- **Returns**: `boolean` - Whether condition is met based on changes
- **Behavior**: Takes fresh snapshot and diffs it with stored snapshot, then asks LLM to evaluate the changes
- **Requires**: Stored snapshot must exist

#### `diff()`
Compares stored snapshot with current page state.

- **Returns**: `DiffResult` with structured changes and summary
- **Behavior**: Takes fresh snapshot of current page and compares with stored snapshot
- **Requires**: Stored snapshot must exist

#### `waitFor(condition: string, timeout?: number)`
Polls page until condition is met.

- **Parameters**:
  - `condition` - Natural language condition
  - `timeout` - Max wait time in ms (default: 30000)
- **Returns**: `boolean` (true when condition met)
- **Behavior**: Polls every 500ms, throws on timeout

### Snapshot Management

```typescript
// Get specific snapshot
const snapshot = tester.getSnapshot(snapshotId);

// Get all snapshots
const allSnapshots = tester.getAllSnapshots();

// Clear all snapshots
tester.clearSnapshots();

// Set a specific snapshot as reference for diff comparison
tester.setReferenceSnapshot(snapshotId);
```

### Error Handling

The service throws `TesterError` with specific error codes:

- `NO_PAGE`: No page provided for operation
- `NO_SNAPSHOT`: No snapshot available for assertion
- `SNAPSHOT_FAILED`: Failed to capture page content
- `ASSERTION_FAILED`: LLM service error
- `DIFF_FAILED`: Snapshot comparison error
- `WAIT_TIMEOUT`: Condition not met within timeout
- `INVALID_SNAPSHOT_ID`: Invalid snapshot reference

## Testing

Run tests:

```bash
bun test lib/b-test/tests/tester.test.ts
```

The tests use real Playwright browsers for authentic testing of HTML capture and page interactions.

## Dependencies

- `playwright` - Browser automation
- `ai` & `@ai-sdk/openai` - LLM integration
- `vitest` - Testing framework
- `jsdom` - DOM environment for testing
