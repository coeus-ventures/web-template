---
name: write-hook-test
description: Generate React hook tests using Testing Library and Jotai patterns. Use when user asks to write tests for React hooks in the Behave.js application.
---

# Write Hook Test

## Purpose

Generate tests for React hooks that manage state (Jotai), validate input (Zod), and call server actions. Tests verify the hook's behavior, optimistic updates, error handling, and state management.

## When to Use

This skill should be used when:
- User asks to "write hook tests" or "test the hook"
- User provides a hook file (use-[name].ts) and wants tests
- User requests to verify hook behavior for a specific feature
- Creating tests for custom React hooks in the behaviors pattern

## Hook Test Structure

Hook tests follow the Testing Library pattern with Jotai state hydration:

### Location Pattern
```
app/(app)/[page-name]/behaviors/[behavior-name]/tests/use-[hook-name].test.tsx
```

### Test File Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { Provider, useAtomValue } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { useHookName } from '../use-hook-name';
import { relevantAtomsFromState } from '../../../state';

// Mock the server action
vi.mock('../action-name.action', () => ({
  actionName: vi.fn(),
}));

const HydrateAtoms = ({ initialValues, children }: { initialValues: any; children: React.ReactNode }) => {
  useHydrateAtoms(initialValues)
  return children
}

const TestProvider = ({ initialValues, children }: { initialValues: any; children: React.ReactNode }) => (
  <Provider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </Provider>
)

describe('useHookName', () => {
  const mockData = {
    // Mock data matching the shape expected by the hook
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful action', async () => {
    const mockAction = vi.mocked(
      await import('../action-name.action')
    ).actionName;

    mockAction.mockResolvedValueOnce(/* expected result */);

    const TestComponent = () => {
      const hook = useHookName();
      const state = useAtomValue(relevantAtom);

      return { hook, state };
    };

    const { result } = renderHook(() => TestComponent(), {
      wrapper: ({ children }) => (
        <TestProvider
          initialValues={[
            [relevantAtom, initialValue],
          ]}
        >
          {children}
        </TestProvider>
      ),
    });

    await act(async () => {
      await result.current.hook.handleAction(/* params */);
    });

    expect(result.current.state).toEqual(/* expected state */);
  });
});
```

## Hook Test Patterns

### 1. Mock Server Actions

Always mock the server action that the hook calls:

```typescript
vi.mock('../action-name.action', () => ({
  actionName: vi.fn(),
}));
```

### 2. Jotai State Hydration

Use the `HydrateAtoms` pattern to initialize Jotai atoms with test data:

```typescript
const HydrateAtoms = ({ initialValues, children }: { initialValues: any; children: React.ReactNode }) => {
  useHydrateAtoms(initialValues)
  return children
}

const TestProvider = ({ initialValues, children }: { initialValues: any; children: React.ReactNode }) => (
  <Provider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </Provider>
)
```

### 3. Test Component Wrapper

Create a test component that uses the hook and exposes state for assertions:

```typescript
const TestComponent = () => {
  const hook = useHookName();
  const state = useAtomValue(relevantAtom);

  return { hook, state };
};
```

### 4. Async State Updates

Use `act` for async operations:

```typescript
await act(async () => {
  await result.current.hook.handleAction(params);
});
```

### 5. Optimistic Updates

Test both optimistic update and rollback scenarios:

```typescript
// Happy path - optimistic update succeeds
it('should optimistically update state', async () => {
  mockAction.mockResolvedValueOnce(newValue);

  await act(async () => {
    await result.current.hook.handleCreate(data);
  });

  expect(result.current.state).toContain(newValue);
});

// Error path - rollback on failure
it('should rollback on error', async () => {
  mockAction.mockRejectedValueOnce(new Error('Failed'));

  await act(async () => {
    try {
      await result.current.hook.handleCreate(data);
    } catch (e) {
      // Expected to throw
    }
  });

  expect(result.current.state).toEqual(initialState);
});
```

## Test Generation Workflow

### 1. Analyze the Hook

Read the hook file and identify:
- Hook name (use-[name].ts)
- Main handler function (handle[Name])
- Server action being called
- Atoms being used (from state.ts)
- Input validation schemas (Zod)
- Optimistic update logic

### 2. Identify Test Scenarios

Determine what to test:
- **Happy path**: Successful action execution with optimistic update
- **Validation errors**: Invalid input caught by Zod
- **Server errors**: Action fails, rollback occurs
- **Loading states**: isLoading flag management
- **Error states**: error message handling

### 3. Create Mock Data

Generate mock data that matches:
- The shape of atoms (from state.ts)
- The expected server action parameters
- The expected server action return values
- All required fields with proper TypeScript types

### 4. Write ONE Test Case

**IMPORTANT: Start with a single test for the happy path.**

Don't try to cover all scenarios immediately. Focus on:
- The most common use case
- Successful execution
- Basic state verification

### 5. Report to User

Show the generated test file and explain:
- What behavior is being tested
- How to run the test (`bun run test`)
- How to expand with additional test cases if needed

## Key Principles

**Testing Approach**:
- Test behavior (state changes, side effects), not implementation
- Use real Jotai state management (no mocking atoms)
- Mock only server actions and external dependencies
- Verify final state, not intermediate steps

**Mock Sparingly**:
- DO mock server actions (they're external to the hook)
- DON'T mock Jotai atoms or providers
- DON'T mock React hooks (useState, useEffect, etc.)
- DON'T use spies or "toHaveBeenCalled" assertions

**Realistic Data**:
- Mock data should include all required fields
- Use proper TypeScript types
- Match the shape of real data from the database
- Include timestamps as `new Date()` objects

## Common Patterns

### Pattern 1: Create/Add Behavior

```typescript
it('should add new item with optimistic update', async () => {
  const newItem = { name: 'New Item', description: 'Test' };

  mockCreateAction.mockResolvedValueOnce({
    id: 'generated-id',
    ...newItem,
    createdAt: new Date(),
  });

  await act(async () => {
    await result.current.hook.handleCreate(newItem);
  });

  expect(result.current.items).toHaveLength(1);
  expect(result.current.items[0].name).toBe('New Item');
});
```

### Pattern 2: Update/Edit Behavior

```typescript
it('should update existing item', async () => {
  const updated = { ...mockItem, name: 'Updated Name' };

  mockUpdateAction.mockResolvedValueOnce(updated);

  await act(async () => {
    await result.current.hook.handleUpdate(mockItem.id, { name: 'Updated Name' });
  });

  expect(result.current.items[0].name).toBe('Updated Name');
});
```

### Pattern 3: Delete/Remove Behavior

```typescript
it('should remove item from state', async () => {
  mockDeleteAction.mockResolvedValueOnce(undefined);

  await act(async () => {
    await result.current.hook.handleDelete(mockItem.id);
  });

  expect(result.current.items).toHaveLength(0);
});
```

## Avoid Common Mistakes

**DON'T**:
- Test implementation details (internal state, private methods)
- Use `.toHaveBeenCalled()` or `.toHaveBeenCalledWith()`
- Mock Jotai atoms or providers
- Test multiple scenarios in one test case initially
- Hardcode UUIDs or timestamps in expected results

**DO**:
- Test observable behavior (state changes, return values)
- Verify final state after actions complete
- Use proper TypeScript types for all mock data
- Start with one test, expand later if needed
- Use `loose: true` or exclude auto-generated fields from assertions

## Required Context

Before generating tests, ensure access to:
1. The hook file (`use-[name].ts`)
2. The server action file (`[name].action.ts`)
3. The state file (`state.ts` with atom definitions)
4. The behavior's location in the app structure

If any are missing, ask the user for clarification before proceeding.

## Reference Materials

For detailed examples and patterns:
- Existing hook tests in the codebase (`**/*.test.tsx`)
- Testing Library documentation for React hooks
- Jotai testing patterns with `useHydrateAtoms`
