---
name: write-action
description: Write server actions following the Epic architecture patterns. Use when creating server-side logic for behaviors, including authentication, validation, and model calls. Triggers on "create an action", "add an action", or "write an action for".
---

# Write Action

## Overview

This skill creates server actions that follow the Epic three-layer architecture. Actions belong to the **Backend layer** and handle authentication, validation, and orchestration of model calls.

## Architecture Context

```
Frontend: Hooks call actions
            |
            v
Backend: Actions (auth + validation + orchestration)
            |
            v
Infrastructure: Models (database operations)
```

Actions:
- Run on the server (Backend layer)
- Check authentication via `getUser()`
- Validate inputs with Zod
- Call models for data operations
- Return consistent response format
- NEVER access database directly

## Action Location and Naming

```
app/[role]/[page]/behaviors/[behavior-name]/
  actions/
    [action-name].action.ts
```

- File names: `kebab-case.action.ts`
- Function names: `camelCase`

## Function Specification Format

Follow the Epic Function specification format from `docs/Epic.md`:

```markdown
## functionName(input: InputType): ReturnType

[Short description of what the function does]

- Given: [input parameters and assumptions]
- Returns: [value or outcome returned]
- Calls: [direct dependencies - models, integrations]

### Example: [Scenario name]

#### Preconditions
[table_name]:
column1, column2
value1, value2

#### Postconditions
[table_name]:
column1, column2
value1, value2
new_id, new_val
```

## Implementation Pattern

```typescript
'use server';

import { getUser } from '@/lib/auth';
import { Model } from '@/shared/models/model-name';
import { z } from 'zod';

const InputSchema = z.object({
  name: z.string().min(1).max(100),
});

type Input = z.infer<typeof InputSchema>;

export async function actionName(input: Input) {
  try {
    // 1. Authentication check
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // 2. Validate input
    const validated = InputSchema.parse(input);

    // 3. Call model (never direct DB access)
    const result = await Model.create({
      ...validated,
      userId: user.id,
    });

    // 4. Return success response
    return { success: true, data: result };
  } catch (error) {
    console.error('actionName error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}
```

## Response Format

Always return consistent format:

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

## Key Patterns

### 1. Authentication First
```typescript
const user = await getUser();
if (!user) {
  return { success: false, error: 'Unauthorized' };
}
```

### 2. Input Validation
```typescript
const validated = InputSchema.parse(input);
// or with safeParse for custom error handling
const result = InputSchema.safeParse(input);
if (!result.success) {
  return { success: false, error: result.error.errors[0].message };
}
```

### 3. User-Scoped Operations
```typescript
// Always filter by userId for user-owned resources
const items = await Model.findByUserId(user.id);
```

### 4. Error Handling
```typescript
try {
  // operation
} catch (error) {
  console.error('actionName error:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'An error occurred',
  };
}
```

## Constraints

- MUST include `'use server'` directive at top
- MUST check authentication when required
- NEVER access database directly - use models
- NEVER import React, Jotai, or frontend code
- ALWAYS return consistent response format
- ALWAYS use try/catch with descriptive errors

## Example Specification

```markdown
## createProject(input: CreateProjectInput): Promise<ActionResponse<Project>>

Creates a new project for the authenticated user.

- Given: project name (1-100 chars) and authenticated user with "client" role
- Returns: the newly created project with status "draft"
- Calls: ProjectModel.findByNameAndUser, ProjectModel.create

### Example: Create project successfully

#### Preconditions
users:
id, email, role
1, user@example.com, client

projects:
id, user_id, name, status
1, 1, Existing Project, active

#### Postconditions
projects:
id, user_id, name, status, created_at
1, 1, Existing Project, active, <timestamp>
2, 1, New Project, draft, <timestamp>

### Example: Reject duplicate name

#### Preconditions
projects:
id, user_id, name
1, 1, My Project

#### Postconditions
(no changes - operation rejected with "Project name already exists")
```
