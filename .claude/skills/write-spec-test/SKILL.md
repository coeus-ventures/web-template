---
name: write-spec-test
description: Generate end-to-end behavior tests using Playwright. Use when user asks to write E2E tests, spec tests, or behavior tests for user workflows in the Behave.js application.
---

# Write Spec Test (E2E/Behavior Test)

## Purpose

Generate end-to-end tests using Playwright that verify complete user workflows from the browser perspective. These tests follow the behavior specifications from `docs/spec.md` and test the full stack: UI interactions, server actions, and database changes.

## When to Use

This skill should be used when:
- User asks to "write spec tests" or "write E2E tests"
- User wants to "test a behavior" or "test a user workflow"
- User provides a behavior specification and wants tests
- Creating end-to-end tests for features following the behaviors pattern
- Testing complete user journeys through the application

## Spec Test Structure

Spec tests (also called behavior tests) use Playwright to interact with the application as a real user would, verifying both UI state and database changes.

### Location Pattern
```
app/(app)/[page-name]/behaviors/[behavior-name]/tests/[behavior-name].spec.ts
```

### Test File Template

```typescript
import { expect, test } from '@playwright/test';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { PreDB, PostDB } from '@/lib/b-test';

test.describe('[Behavior Name]', () => {
  // Use authenticated session for protected routes
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('[should do something when user performs action]', async ({ page }) => {
    // PreDB: Set up initial database state
    // Use { only: [...] } to preserve user/account for auth
    await PreDB(db, schema, {
      tableName: [],
    }, { only: ['tableName'] });

    // Navigate to the page
    await page.goto('/page-path');

    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Perform user interactions
    await page.locator('[data-testid="button-id"]').click();
    await page.locator('[data-testid="input-id"]').fill('value');

    // Verify UI changes
    await expect(page.getByText('Expected Text')).toBeVisible({ timeout: 5000 });

    // PostDB: Verify database changes
    // Use { loose: true } to ignore auto-generated fields
    await PostDB(db, schema, {
      tableName: [
        {
          field: 'value',
          // Don't include: id, createdAt, updatedAt, userId (auto-generated)
        },
      ],
    }, { loose: true });
  });
});
```

## Spec Test Patterns

### 1. PreDB - Initial Database State

**Purpose**: Set up a clean, deterministic state before the test runs.

**Pattern**:
```typescript
await PreDB(db, schema, {
  tableName: [],  // Empty table
}, { only: ['tableName'] });  // Only wipe this table, preserve auth tables
```

**Key Points**:
- Use `{ only: [...] }` to preserve `user`, `account`, `session` tables for authentication
- Empty arrays (`[]`) clear the table
- Can include initial data as array of objects
- Ensures tests start from a known state

### 2. Authentication

**Pattern for Protected Routes**:
```typescript
test.use({ storageState: 'playwright/.auth/user.json' });
```

**Pattern for Public Routes**:
```typescript
// No authentication setup needed
test('public page loads', async ({ page }) => {
  await page.goto('/');
});
```

**Key Points**:
- Use `playwright/.auth/user.json` for authenticated tests
- This file is created by the global setup script
- Don't mock authentication in Playwright tests

### 3. Page Navigation and Loading

**Pattern**:
```typescript
await page.goto('/page-path');
await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
```

**Key Points**:
- Always wait for key elements after navigation
- Use appropriate timeouts (10000ms for page load, 5000ms for interactions)
- Verify the page loaded correctly before interacting

### 4. User Interactions

**Clicking Elements**:
```typescript
await page.locator('[data-testid="button-id"]').click();
await page.getByRole('button', { name: 'Submit' }).click();
```

**Filling Forms**:
```typescript
await page.locator('[data-testid="name-input"]').fill('John Doe');
await page.locator('[data-testid="email-input"]').fill('john@example.com');
```

**Waiting for Dialogs/Modals**:
```typescript
await expect(page.locator('role=dialog')).toBeVisible({ timeout: 5000 });
```

**Key Points**:
- Prefer `data-testid` attributes for stable selectors
- Use role-based selectors when appropriate
- Add explicit waits for async UI changes

### 5. UI Verification

**Check Visibility**:
```typescript
await expect(page.getByText('Success message')).toBeVisible({ timeout: 5000 });
await expect(page.locator('[data-testid="item"]')).toBeVisible();
```

**Check Absence**:
```typescript
await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5000 });
```

**Check Content**:
```typescript
await expect(page.locator('h1')).toContainText('Expected Title');
```

**Key Points**:
- Always use timeouts for async operations
- Verify both positive (visible) and negative (not visible) states
- Test success messages, toasts, and feedback

### 6. PostDB - Database Verification

**Pattern**:
```typescript
await PostDB(db, schema, {
  tableName: [
    {
      field1: 'value1',
      field2: 'value2',
      // Omit: id, createdAt, updatedAt, userId (auto-generated)
    },
  ],
}, { loose: true });
```

**Key Points**:
- Use `{ loose: true }` to ignore auto-generated fields
- Only include fields you explicitly set
- Don't include dynamic fields (UUIDs, timestamps, foreign keys from auth)
- PostDB verifies the data actually saved to the database

## Test Generation Workflow

### 1. Analyze the Behavior Specification

From the behavior spec (in `docs/spec.md` or issue), identify:
- **Behavior name**: e.g., "add contact", "delete task", "create project"
- **Page path**: Where the behavior occurs (e.g., `/contacts`, `/tasks`)
- **User interactions**: Click buttons, fill forms, submit data
- **Expected UI changes**: Success messages, new items appear, dialogs close
- **Database changes**: What data should be created, updated, or deleted

### 2. Identify Database Tables

Determine which tables are involved:
- Tables to clear in PreDB (with `only` option)
- Tables to verify in PostDB
- Fields to test (excluding auto-generated ones)

### 3. Create Test Data

Define test data that matches:
- The form fields in the UI
- The database schema
- Realistic values (names, emails, dates, etc.)

**Example**:
```typescript
const testData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1 (555) 123-4567',
  company: 'Tech Solutions',
};
```

### 4. Map UI Interactions

For each step in the workflow:
1. Navigate to the page
2. Wait for elements to load
3. Perform actions (click, fill, submit)
4. Verify UI feedback (messages, navigation, state changes)
5. Verify database changes

### 5. Write ONE Test Case

**IMPORTANT: Start with a single test for the happy path.**

Focus on:
- The most common user scenario
- Successful completion of the action
- Positive verification (data created, UI updated)

**Don't initially test**:
- Error cases
- Edge cases
- Validation failures

Those can be added later if needed.

### 6. Report to User

Show the generated test file and explain:
- What workflow is being tested
- How to run the test (`bun run spec`)
- What the test verifies (UI + database)
- How to expand with additional scenarios if needed

## Key Principles

**CRITICAL: NO MOCKING IN PLAYWRIGHT TESTS**
- Playwright runs in the browser context where `vi.mock()` does not work
- Use real navigation, real interactions, real database
- Use `PreDB/PostDB` for database setup, not mocks
- Use authenticated sessions, not mocked auth

**Testing Philosophy**:
- Test from the user's perspective
- Verify complete workflows, not isolated units
- Test both UI state and database changes
- Use deterministic database state (PreDB/PostDB)

**Best Practices**:
- One test per behavior initially
- Use descriptive test names ("should create contact when user submits form")
- Wait for elements explicitly (don't assume instant rendering)
- Use data-testid attributes for stable selectors
- Clean up test data with PreDB at the start

## Common Test Patterns

### Pattern 1: Create/Add Behavior

**Workflow**: Navigate → Open form → Fill fields → Submit → Verify UI → Verify DB

```typescript
test('creates new item', async ({ page }) => {
  await PreDB(db, schema, { items: [] }, { only: ['items'] });

  await page.goto('/items');
  await page.locator('[data-testid="add-item-button"]').click();
  await expect(page.locator('role=dialog')).toBeVisible({ timeout: 5000 });

  await page.locator('[data-testid="name-input"]').fill('New Item');
  await page.locator('[data-testid="description-input"]').fill('Description');
  await page.locator('[data-testid="save-button"]').click();

  await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Item created successfully')).toBeVisible();
  await expect(page.getByText('New Item')).toBeVisible();

  await PostDB(db, schema, {
    items: [{ name: 'New Item', description: 'Description' }],
  }, { loose: true });
});
```

### Pattern 2: Update/Edit Behavior

**Workflow**: Navigate → Find item → Open edit form → Change fields → Submit → Verify UI → Verify DB

```typescript
test('updates existing item', async ({ page }) => {
  await PreDB(db, schema, {
    items: [{ name: 'Old Name', description: 'Old Desc' }],
  }, { only: ['items'] });

  await page.goto('/items');
  await page.locator('[data-testid="edit-item-button"]').first().click();
  await expect(page.locator('role=dialog')).toBeVisible({ timeout: 5000 });

  await page.locator('[data-testid="name-input"]').fill('New Name');
  await page.locator('[data-testid="save-button"]').click();

  await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Item updated successfully')).toBeVisible();
  await expect(page.getByText('New Name')).toBeVisible();

  await PostDB(db, schema, {
    items: [{ name: 'New Name', description: 'Old Desc' }],
  }, { loose: true });
});
```

### Pattern 3: Delete/Remove Behavior

**Workflow**: Navigate → Find item → Click delete → Confirm → Verify UI → Verify DB

```typescript
test('deletes item', async ({ page }) => {
  await PreDB(db, schema, {
    items: [{ name: 'Item to Delete', description: 'Test' }],
  }, { only: ['items'] });

  await page.goto('/items');
  await expect(page.getByText('Item to Delete')).toBeVisible();

  await page.locator('[data-testid="delete-item-button"]').first().click();
  await expect(page.getByText('Are you sure?')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="confirm-delete-button"]').click();

  await expect(page.getByText('Item deleted successfully')).toBeVisible();
  await expect(page.getByText('Item to Delete')).not.toBeVisible();

  await PostDB(db, schema, {
    items: [],
  }, { loose: true });
});
```

### Pattern 4: Filter/Search Behavior

**Workflow**: Navigate → Enter search term → Verify filtered results

```typescript
test('filters items by search term', async ({ page }) => {
  await PreDB(db, schema, {
    items: [
      { name: 'Apple', description: 'Fruit' },
      { name: 'Banana', description: 'Fruit' },
      { name: 'Carrot', description: 'Vegetable' },
    ],
  }, { only: ['items'] });

  await page.goto('/items');
  await expect(page.getByText('Apple')).toBeVisible();

  await page.locator('[data-testid="search-input"]').fill('Ban');

  await expect(page.getByText('Banana')).toBeVisible();
  await expect(page.getByText('Apple')).not.toBeVisible();
  await expect(page.getByText('Carrot')).not.toBeVisible();

  // No PostDB needed - no database changes for filter/search
});
```

## Avoid Common Mistakes

**DON'T**:
- Use `vi.mock()` or any Vitest mocking in Playwright tests
- Mock authentication (use `storageState` instead)
- Test implementation details (internal state, function calls)
- Hardcode UUIDs or timestamps in PostDB assertions
- Include auto-generated fields in PostDB (id, createdAt, updatedAt, userId)
- Write multiple test cases initially

**DO**:
- Use real navigation and interactions
- Use `PreDB/PostDB` for database state management
- Wait for elements explicitly before interacting
- Use `data-testid` attributes for stable selectors
- Test from the user's perspective
- Focus on one happy path test initially
- Use `{ only: [...] }` in PreDB to preserve auth tables
- Use `{ loose: true }` in PostDB to ignore auto-generated fields

## Required Context

Before generating tests, ensure access to:
1. The behavior specification (from `docs/spec.md` or issue)
2. The page path where the behavior occurs
3. The database schema (`db/schema.ts`)
4. The tables involved in the behavior
5. The UI component structure (to identify selectors)

If any are missing, ask the user for clarification before proceeding.

## Reference Materials

For detailed examples and patterns:
- `references/spec-test-examples.md` - Complete real-world examples
- Existing spec tests in the codebase (`**/*.spec.ts`)
- Playwright documentation for advanced selectors and assertions
