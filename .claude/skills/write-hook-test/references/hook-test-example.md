# Hook Test Example Reference

This document provides a complete, real-world example of a hook test from the codebase.

## Example: useDeletePage Hook Test

**Location**: `app/(app)/[page]/behaviors/delete-page/tests/use-delete-page.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { Provider, useAtomValue } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { useDeletePage } from '../use-delete-page';
import {
  PageState,
  issuesAtom,
  ProjectState,
} from '../../../state';

// Mock the server action
vi.mock('../delete-page.action', () => ({
  deletePageAction: vi.fn(),
}));

// Helper component to hydrate atoms with initial values
const HydrateAtoms = ({ initialValues, children }: { initialValues: any; children: React.ReactNode }) => {
  useHydrateAtoms(initialValues)
  return children
}

// Test provider wrapper that includes Jotai Provider and atom hydration
const TestProvider = ({ initialValues, children }: { initialValues: any; children: React.ReactNode }) => (
  <Provider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </Provider>
)

describe('useDeletePage', () => {
  // Mock data with all required fields and proper types
  const mockPage = {
    id: 'test-page-id',
    name: 'Test Page',
    description: 'Test Description',
    path: '/test-page',
    status: 'todo' as const,
    projectId: 'test-project-id',
    modelType: 'claude' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProject = {
    id: 'test-project-id',
    name: 'Test Project',
  };

  const mockIssues = [
    {
      id: 'issue-1',
      pageId: 'test-page-id',
      title: 'Issue 1',
    },
    {
      id: 'issue-2',
      pageId: 'other-page-id',
      title: 'Issue 2',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful page deletion', async () => {
    // Get the mocked action
    const mockDeletePageAction = vi.mocked(
      await import('../delete-page.action')
    ).deletePageAction;

    // Configure mock to resolve successfully
    mockDeletePageAction.mockResolvedValueOnce(undefined);

    // Create a test component that uses the hook and exposes state
    const TestComponent = () => {
      const deletePage = useDeletePage();
      const pages = useAtomValue(PageState);

      return { deletePage, pages };
    };

    // Render the hook with Jotai provider and initial atom values
    const { result } = renderHook(() => TestComponent(), {
      wrapper: ({ children }) => (
        <TestProvider
          initialValues={[
            [PageState, [mockPage]],
            [issuesAtom, mockIssues],
            [ProjectState, mockProject],
          ]}
        >
          {children}
        </TestProvider>
      ),
    });

    // Execute the hook's handler function
    await act(async () => {
      await result.current.deletePage.deletePage(mockPage, false);
    });

    // Verify the final state - page should be removed
    expect(result.current.pages).toEqual([]);
  });
});
```

## Key Takeaways

### 1. Mock Setup
```typescript
vi.mock('../delete-page.action', () => ({
  deletePageAction: vi.fn(),
}));
```
- Mock at the top level, outside the describe block
- Mock the entire module with the action function

### 2. Jotai State Hydration
```typescript
const HydrateAtoms = ({ initialValues, children }) => {
  useHydrateAtoms(initialValues)
  return children
}

const TestProvider = ({ initialValues, children }) => (
  <Provider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </Provider>
)
```
- Standard pattern for initializing atoms in tests
- Reusable across all hook tests

### 3. Test Component Wrapper
```typescript
const TestComponent = () => {
  const hook = useDeletePage();
  const state = useAtomValue(PageState);
  return { hook, state };
};
```
- Exposes both the hook and relevant state
- Makes assertions easier

### 4. Realistic Mock Data
```typescript
const mockPage = {
  id: 'test-page-id',
  name: 'Test Page',
  status: 'todo' as const,  // Use const assertion for literal types
  createdAt: new Date(),     // Real Date objects
  // ... all required fields
};
```
- Include ALL required fields
- Use proper TypeScript types
- Use real Date objects, not strings

### 5. Act Pattern
```typescript
await act(async () => {
  await result.current.hook.handleAction(params);
});
```
- Always wrap hook calls that update state in `act()`
- Use async/await for asynchronous operations

### 6. State-Based Assertions
```typescript
expect(result.current.pages).toEqual([]);
```
- Verify the final state after the action
- Don't use `.toHaveBeenCalled()` or similar
- Focus on observable behavior

## Common Variations

### Testing Error Handling

```typescript
it('should handle deletion error with rollback', async () => {
  const mockDeletePageAction = vi.mocked(
    await import('../delete-page.action')
  ).deletePageAction;

  // Mock action to reject
  mockDeletePageAction.mockRejectedValueOnce(new Error('Delete failed'));

  const TestComponent = () => {
    const deletePage = useDeletePage();
    const pages = useAtomValue(PageState);
    return { deletePage, pages };
  };

  const { result } = renderHook(() => TestComponent(), {
    wrapper: ({ children }) => (
      <TestProvider initialValues={[[PageState, [mockPage]]]}>
        {children}
      </TestProvider>
    ),
  });

  // Expect the action to throw
  await act(async () => {
    await expect(
      result.current.deletePage.deletePage(mockPage, false)
    ).rejects.toThrow('Delete failed');
  });

  // State should be rolled back to original
  expect(result.current.pages).toEqual([mockPage]);
});
```

### Testing Optimistic Updates

```typescript
it('should optimistically add new item before server confirms', async () => {
  const mockCreateAction = vi.mocked(
    await import('../create-item.action')
  ).createItemAction;

  const newItem = { id: 'server-id', name: 'New Item', createdAt: new Date() };
  mockCreateAction.mockResolvedValueOnce(newItem);

  const TestComponent = () => {
    const createItem = useCreateItem();
    const items = useAtomValue(itemsAtom);
    return { createItem, items };
  };

  const { result } = renderHook(() => TestComponent(), {
    wrapper: ({ children }) => (
      <TestProvider initialValues={[[itemsAtom, []]]}>
        {children}
      </TestProvider>
    ),
  });

  await act(async () => {
    await result.current.createItem.handleCreate({ name: 'New Item' });
  });

  // Item should be added with server-generated ID
  expect(result.current.items).toHaveLength(1);
  expect(result.current.items[0].name).toBe('New Item');
});
```

### Testing Loading States

```typescript
it('should set loading state during action', async () => {
  const mockAction = vi.mocked(await import('../action.action')).action;

  // Delay the resolution to capture loading state
  let resolveAction: () => void;
  const actionPromise = new Promise<void>((resolve) => {
    resolveAction = resolve;
  });
  mockAction.mockReturnValueOnce(actionPromise);

  const TestComponent = () => {
    const hook = useHook();
    return { hook };
  };

  const { result } = renderHook(() => TestComponent(), {
    wrapper: ({ children }) => (
      <TestProvider initialValues={[]}>{children}</TestProvider>
    ),
  });

  // Start action without awaiting
  act(() => {
    result.current.hook.handleAction();
  });

  // Check loading state
  expect(result.current.hook.isLoading).toBe(true);

  // Resolve the action
  await act(async () => {
    resolveAction!();
    await actionPromise;
  });

  // Loading should be false
  expect(result.current.hook.isLoading).toBe(false);
});
```
