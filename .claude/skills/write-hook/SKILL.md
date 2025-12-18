---
name: write-hook
description: Write React hooks following the Epic architecture patterns. Use when creating custom hooks for state management, server action calls, optimistic updates, and validation. Triggers on "create a hook", "add a hook", or "write a hook for".
---

# Write Hook

## Overview

This skill creates React hooks that follow the Epic three-layer architecture. Hooks belong to the **Frontend layer** and handle state management, validation, server action calls, and optimistic updates.

## Architecture Context

```
Frontend (Browser): Components -> Hooks -> State (Jotai)
                          |
                          v
Backend (Server): Actions
```

Hooks:
- Run in the browser (Frontend layer)
- Manage state with Jotai atoms
- Validate inputs with Zod
- Call server actions
- Handle optimistic updates and rollback
- NEVER access database or import server-only code

## Hook Location and Naming

```
app/[role]/[page]/behaviors/[behavior-name]/
  hooks/
    use-[behavior-name].ts    # Hook file
  actions/
    [action-name].action.ts   # Server action it calls
```

- File names start with `use-` and match the exported function
- Behavior folders use kebab-case

## Hook Specification Format

Follow the Epic Hook specification format:

```markdown
## useHookName(params?: ParamType)

[Short description of what stateful logic this hook encapsulates]

### Parameters
- paramName: Type - description

### State
- stateName: Type
- anotherState: Type

### Returns
- value: Type - description
- action: () => void - description

### Dependencies
- useOtherHook - why it's needed
```

## Implementation Pattern

```typescript
import { useAtom } from 'jotai';
import { useState } from 'react';
import { z } from 'zod';
import { actionName } from './actions/action-name.action';
import { itemsAtom } from '@/app/[role]/[page]/state';

// Validation schema
const InputSchema = z.object({
  name: z.string().min(1).max(100),
});

export function useBehaviorName() {
  const [items, setItems] = useAtom(itemsAtom);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (data: unknown) => {
    // 1. Validate input
    const result = InputSchema.safeParse(data);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsPending(true);
    setError(null);

    // 2. Optimistic update
    const optimisticItem = {
      ...result.data,
      id: crypto.randomUUID(),
      pending: true,
    };
    setItems(prev => [...prev, optimisticItem]);

    try {
      // 3. Call server action
      const response = await actionName(result.data);

      if (response.success && response.data) {
        // 4. Replace optimistic with real data
        setItems(prev =>
          prev.map(item =>
            item.id === optimisticItem.id ? response.data : item
          )
        );
      } else {
        // 5. Rollback on failure
        setItems(prev => prev.filter(item => item.id !== optimisticItem.id));
        setError(response.error || 'Operation failed');
      }
    } catch (err) {
      // 6. Rollback on error
      setItems(prev => prev.filter(item => item.id !== optimisticItem.id));
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsPending(false);
    }
  };

  return {
    items,
    isPending,
    error,
    handleAction,
  };
}
```

## Key Patterns

### 1. Validation First
- Always validate input with Zod schemas before operations
- Use `safeParse` and handle validation errors gracefully
- Return early with error messages for invalid input

### 2. Optimistic Updates
- Add temporary records with `pending: true` flag
- Generate temporary IDs with `crypto.randomUUID()`
- Always rollback on failure
- Replace optimistic items with real data on success

### 3. Error Handling
- Set loading states appropriately
- Clear previous errors before new operations
- Provide descriptive error messages
- Use try/catch with proper error type checking

### 4. State Management
- Use Jotai atoms defined in page's `state.ts`
- Return consistent object shape: `{ data, isPending, error, handlers }`
- Keep state updates atomic and predictable

### 5. Server Action Calls
- Import actions from `./actions/[action-name].action`
- Handle standard response: `{ success: boolean, data?: T, error?: string }`
- Never call actions directly from components

## Constraints

- NEVER import database clients or models
- NEVER use `window.fetch` - always call server actions
- NEVER put business logic in hooks - that belongs in actions
- ALWAYS include both loading and error states
- ALWAYS validate input before calling server actions
- ALWAYS implement optimistic updates for better UX

## Example Specification

```markdown
## useCreateProject(options?: CreateProjectOptions)

Manages form state and submission for creating a new project.

### Parameters
- options.onSuccess: (project: Project) => void - callback after creation

### State
- name: string
- errors: ValidationErrors
- isPending: boolean

### Returns
- name: string - current name value
- errors: ValidationErrors - field-level errors
- isPending: boolean - submission in progress
- setName: (value: string) => void - update name field
- submit: () => Promise<void> - validate and submit
- reset: () => void - clear form

### Dependencies
- useProjects - for optimistic updates to project list
- useToast - for success/error notifications
```
