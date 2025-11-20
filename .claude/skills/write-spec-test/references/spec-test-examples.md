# Spec Test Examples Reference

This document provides complete, real-world examples of spec/behavior tests from the Behave.js framework.

## Example 1: Add Contact Behavior

**Location**: `app/(app)/contacts/behaviors/add-contact/tests/add-contact.spec.ts`

This is a classic "create" behavior test that demonstrates all key patterns.

```typescript
import { expect, test } from '@playwright/test';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { PreDB, PostDB } from '@/lib/b-test';

test.describe('Add Contact Behavior', () => {
  // Use authenticated session for protected routes
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('creates a new contact successfully', async ({ page }) => {
    // PreDB: Clear contacts table before test (preserve user/account for auth)
    // This ensures we start with a clean slate
    await PreDB(db, schema, {
      contacts: [],
    }, { only: ['contacts'] }); // Only wipe contacts table, not user/account

    // Navigate to contacts page
    await page.goto('/contacts');

    // Wait for page to be fully loaded
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Click the "Add Contact" button
    const addButton = page.locator('[data-testid="add-contact-button"]');
    await addButton.click();

    // Wait for dialog to open
    await expect(page.locator('role=dialog')).toBeVisible({ timeout: 5000 });

    // Fill in the form fields
    await page.locator('[data-testid="contact-name-input"]').fill('John Doe');
    await page.locator('[data-testid="contact-email-input"]').fill('john@example.com');
    await page.locator('[data-testid="contact-phone-input"]').fill('+1 (555) 123-4567');
    await page.locator('[data-testid="contact-company-input"]').fill('Tech Solutions');
    await page.locator('[data-testid="contact-notes-input"]').fill('Met at conference');

    // Click "Save Contact" button
    const saveButton = page.locator('[data-testid="save-contact-button"]');
    await saveButton.click();

    // Verify dialog closes
    await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5000 });

    // Verify success toast appears
    await expect(page.getByText('Contact created successfully')).toBeVisible({ timeout: 5000 });

    // Verify new contact appears in the contacts list
    await expect(page.getByText('John Doe')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('john@example.com')).toBeVisible();
    await expect(page.getByText('Tech Solutions')).toBeVisible();

    // PostDB: Verify the contact was actually saved to the database
    // Note: Don't include auto-generated fields like userId in expected data
    await PostDB(db, schema, {
      contacts: [
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 (555) 123-4567',
          company: 'Tech Solutions',
          notes: 'Met at conference',
        },
      ],
    }, { loose: true }); // loose: true ignores auto-generated fields (id, createdAt, updatedAt)
  });
});
```

### Key Takeaways

1. **PreDB Setup**: Clear the table with `{ only: ['contacts'] }` to preserve auth data
2. **Authentication**: Use `test.use({ storageState: 'playwright/.auth/user.json' })`
3. **Wait for Load**: Always wait for key elements after navigation
4. **Data-testid Selectors**: Use `[data-testid="..."]` for stable element selection
5. **Explicit Waits**: Use timeouts for dialogs and async operations
6. **Multi-level Verification**: Check dialog close, toast message, and list appearance
7. **PostDB Verification**: Use `{ loose: true }` to ignore auto-generated fields
8. **Omit Dynamic Fields**: Don't include id, userId, createdAt, updatedAt in PostDB

## Example 2: Delete Item Behavior

**Scenario**: User deletes a task from a task list

```typescript
import { expect, test } from '@playwright/test';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { PreDB, PostDB } from '@/lib/b-test';

test.describe('Delete Task Behavior', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('deletes a task successfully', async ({ page }) => {
    // PreDB: Set up initial task
    await PreDB(db, schema, {
      tasks: [
        {
          title: 'Task to Delete',
          completed: false,
          description: 'This will be deleted',
        },
      ],
    }, { only: ['tasks'] });

    // Navigate to tasks page
    await page.goto('/tasks');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Verify task is visible
    await expect(page.getByText('Task to Delete')).toBeVisible();

    // Click delete button
    await page.locator('[data-testid="delete-task-button"]').first().click();

    // Confirm deletion in dialog
    await expect(page.getByText('Are you sure?')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="confirm-delete-button"]').click();

    // Verify success message
    await expect(page.getByText('Task deleted successfully')).toBeVisible({ timeout: 5000 });

    // Verify task is removed from UI
    await expect(page.getByText('Task to Delete')).not.toBeVisible();

    // PostDB: Verify task is deleted from database
    await PostDB(db, schema, {
      tasks: [],
    }, { loose: true });
  });
});
```

### Key Patterns

- **PreDB with Initial Data**: Set up the item to be deleted
- **Verify Before Delete**: Check the item exists before deleting
- **Confirmation Dialog**: Wait for and interact with confirmation
- **Negative Assertions**: Use `.not.toBeVisible()` to verify deletion
- **Empty PostDB**: Verify table is empty after deletion

## Example 3: Update/Edit Behavior

**Scenario**: User edits an existing project

```typescript
import { expect, test } from '@playwright/test';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { PreDB, PostDB } from '@/lib/b-test';

test.describe('Edit Project Behavior', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('updates project details successfully', async ({ page }) => {
    // PreDB: Set up initial project
    await PreDB(db, schema, {
      projects: [
        {
          name: 'Old Project Name',
          description: 'Old description',
          status: 'active',
        },
      ],
    }, { only: ['projects'] });

    // Navigate to projects page
    await page.goto('/projects');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Click edit button
    await page.locator('[data-testid="edit-project-button"]').first().click();

    // Wait for edit dialog
    await expect(page.locator('role=dialog')).toBeVisible({ timeout: 5000 });

    // Update fields
    await page.locator('[data-testid="project-name-input"]').fill('New Project Name');
    await page.locator('[data-testid="project-description-input"]').fill('New description');

    // Submit changes
    await page.locator('[data-testid="save-project-button"]').click();

    // Verify dialog closes
    await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5000 });

    // Verify success message
    await expect(page.getByText('Project updated successfully')).toBeVisible({ timeout: 5000 });

    // Verify updated values in UI
    await expect(page.getByText('New Project Name')).toBeVisible();
    await expect(page.getByText('New description')).toBeVisible();

    // PostDB: Verify changes in database
    await PostDB(db, schema, {
      projects: [
        {
          name: 'New Project Name',
          description: 'New description',
          status: 'active', // Unchanged field
        },
      ],
    }, { loose: true });
  });
});
```

### Key Patterns

- **PreDB with Existing Data**: Set up the item to be edited
- **Edit Flow**: Click edit → Wait for dialog → Change fields → Submit
- **Verify Changes**: Check both UI and database reflect updates
- **Include Unchanged Fields**: PostDB should verify all relevant fields

## Example 4: Filter/Search Behavior (No Database Changes)

**Scenario**: User filters a list by search term

```typescript
import { expect, test } from '@playwright/test';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { PreDB } from '@/lib/b-test';

test.describe('Search Tasks Behavior', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('filters tasks by search term', async ({ page }) => {
    // PreDB: Set up multiple tasks
    await PreDB(db, schema, {
      tasks: [
        { title: 'Buy groceries', completed: false },
        { title: 'Write report', completed: false },
        { title: 'Buy tickets', completed: false },
        { title: 'Call dentist', completed: false },
      ],
    }, { only: ['tasks'] });

    // Navigate to tasks page
    await page.goto('/tasks');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Verify all tasks are visible initially
    await expect(page.getByText('Buy groceries')).toBeVisible();
    await expect(page.getByText('Write report')).toBeVisible();
    await expect(page.getByText('Buy tickets')).toBeVisible();
    await expect(page.getByText('Call dentist')).toBeVisible();

    // Enter search term
    await page.locator('[data-testid="search-input"]').fill('Buy');

    // Verify only matching tasks are visible
    await expect(page.getByText('Buy groceries')).toBeVisible();
    await expect(page.getByText('Buy tickets')).toBeVisible();
    await expect(page.getByText('Write report')).not.toBeVisible();
    await expect(page.getByText('Call dentist')).not.toBeVisible();

    // No PostDB needed - search doesn't modify database
  });
});
```

### Key Patterns

- **Multiple Items in PreDB**: Set up varied data for filtering
- **Initial State Verification**: Check all items visible before filtering
- **Partial Match Testing**: Search term matches multiple items
- **Negative Assertions**: Verify non-matching items are hidden
- **No PostDB**: Read-only operations don't need database verification

## Example 5: Multi-Step Workflow

**Scenario**: User creates a project and adds a task to it

```typescript
import { expect, test } from '@playwright/test';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { PreDB, PostDB } from '@/lib/b-test';

test.describe('Create Project and Add Task', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('creates project then adds task to it', async ({ page }) => {
    // PreDB: Start with clean slate
    await PreDB(db, schema, {
      projects: [],
      tasks: [],
    }, { only: ['projects', 'tasks'] });

    // Step 1: Create project
    await page.goto('/projects');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    await page.locator('[data-testid="add-project-button"]').click();
    await expect(page.locator('role=dialog')).toBeVisible({ timeout: 5000 });

    await page.locator('[data-testid="project-name-input"]').fill('My Project');
    await page.locator('[data-testid="save-project-button"]').click();

    await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Project created successfully')).toBeVisible();

    // Step 2: Navigate to project detail
    await page.getByText('My Project').click();
    await expect(page.locator('h1')).toContainText('My Project');

    // Step 3: Add task to project
    await page.locator('[data-testid="add-task-button"]').click();
    await expect(page.locator('role=dialog')).toBeVisible({ timeout: 5000 });

    await page.locator('[data-testid="task-title-input"]').fill('First Task');
    await page.locator('[data-testid="save-task-button"]').click();

    await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Task created successfully')).toBeVisible();
    await expect(page.getByText('First Task')).toBeVisible();

    // PostDB: Verify both project and task exist
    await PostDB(db, schema, {
      projects: [
        { name: 'My Project' },
      ],
      tasks: [
        { title: 'First Task' },
      ],
    }, { loose: true });
  });
});
```

### Key Patterns

- **Multiple Tables in PreDB**: Clear all related tables
- **Sequential Steps**: Create parent → Navigate → Create child
- **Navigation Between Pages**: Use clicks and URL changes
- **Multiple PostDB Tables**: Verify relationships exist
- **Don't Test Foreign Keys**: PostDB with `loose: true` ignores projectId

## Common Patterns Summary

### 1. PreDB Patterns

**Empty table**:
```typescript
await PreDB(db, schema, { tasks: [] }, { only: ['tasks'] });
```

**With initial data**:
```typescript
await PreDB(db, schema, {
  tasks: [{ title: 'Existing Task', completed: false }]
}, { only: ['tasks'] });
```

**Multiple tables**:
```typescript
await PreDB(db, schema, {
  projects: [],
  tasks: [],
  users: [] // Be careful with auth tables!
}, { only: ['projects', 'tasks', 'users'] });
```

### 2. PostDB Patterns

**Single item created**:
```typescript
await PostDB(db, schema, {
  tasks: [{ title: 'New Task', completed: false }]
}, { loose: true });
```

**Item deleted (empty)**:
```typescript
await PostDB(db, schema, {
  tasks: []
}, { loose: true });
```

**Item updated**:
```typescript
await PostDB(db, schema, {
  tasks: [{ title: 'Updated Title', completed: true }]
}, { loose: true });
```

### 3. Locator Patterns

**By test ID (preferred)**:
```typescript
page.locator('[data-testid="button-id"]')
```

**By role**:
```typescript
page.getByRole('button', { name: 'Submit' })
```

**By text**:
```typescript
page.getByText('Exact Text')
page.getByText(/partial text/i)
```

**By role with locator**:
```typescript
page.locator('role=dialog')
```

### 4. Wait Patterns

**Wait for visibility**:
```typescript
await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
```

**Wait for invisibility**:
```typescript
await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5000 });
```

**Wait for text content**:
```typescript
await expect(page.locator('h1')).toContainText('Expected');
```

## Debugging Tips

### Check What's on the Page
```typescript
// Take a screenshot
await page.screenshot({ path: 'debug.png' });

// Print page content
console.log(await page.content());

// Print specific element content
console.log(await page.locator('h1').textContent());
```

### Increase Timeouts for Debugging
```typescript
await expect(page.locator('h1')).toBeVisible({ timeout: 30000 });
```

### Run in Headed Mode
```bash
bun run spec --headed
```

### Run Specific Test
```bash
bun run spec tests/add-contact.spec.ts
```
