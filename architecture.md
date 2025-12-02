# Behave Architecture Reference

This document describes the architecture of the Behave codebase, a two-sided marketplace for software development.

## Three-Layer Architecture

Behave follows a strict three-layer architecture with unidirectional data flow:

```
+-------------------------------------+
|          FRONTEND LAYER             |
|   Components -> Hooks -> States     |
|          (Browser)                  |
+-------------------------------------+
              |
              v
+-------------------------------------+
|         BACKEND LAYER               |
|   Routes + Actions + Workflows      |
|          (Server)                   |
+-------------------------------------+
              |
              v
+-------------------------------------+
|      INFRASTRUCTURE LAYER           |
|      Models  +  Services            |
|          (Server)                   |
+-------------------------------------+
```

**Critical Rule**: Data flows top to bottom only. No layer may import from layers above it.

- **Frontend**: React Components + Hooks + Jotai State (client-side)
- **Backend**: Server Actions + API Routes + Workflows (Inngest)
- **Infrastructure**: Database Models + External Services

## Folder Structure

```
web/
+-- app/                          # Next.js App Router
|   +-- client/                   # Client-facing pages
|   |   +-- home/                 # Dashboard with project management
|   |   +-- issues/               # Issue detail pages
|   |   +-- plan/                 # Project planning
|   |   +-- project/              # Project workspace
|   |   +-- settings/             # User settings
|   +-- api/                      # API routes and webhooks
|   +-- auth/                     # Authentication pages
|
+-- shared/                       # Shared modules (cross-behavior)
|   +-- models/                   # Database models (Active Record)
|   +-- actions/                  # Shared server actions
|   +-- hooks/                    # Shared client hooks
|   +-- states/                   # Global Jotai atoms
|   +-- workflows/                # Inngest workflow definitions
|   +-- services/                 # External service integrations
|   +-- prompts/                  # AI prompts
|
+-- lib/                          # Utility functions
|   +-- behave-test/              # Testing utilities (PreDB/PostDB)
|
+-- components/                   # Shared React components
|   +-- ui/                       # shadcn/ui components
|
+-- db/                           # Database schema and migrations
|   +-- schema.ts                 # Drizzle schema
|   +-- migrations/               # Migration files
|   +-- seed/                     # Seed data
|
+-- types/                        # TypeScript definitions
```

## Behaviors Pattern

Features are organized using a **behaviors pattern** - a page-centric organization where each page contains behaviors, and each behavior contains all related code for that feature.

### Behavior Directory Structure

```
app/[role]/[page]/behaviors/
  [behavior-name]/
    actions/                        # Server actions
      [behavior-name].action.ts
    hooks/                          # Client hooks
      use-[behavior-name].ts
    workflows/                      # Background workflows (Inngest)
      [workflow-name]/
        [workflow-name].workflow.ts
        steps.ts
    services/                       # Behavior-specific services (optional)
    tests/
      [behavior-name].spec.ts       # E2E tests (Playwright)
      [behavior-name].action.test.ts # Action unit tests
      use-[behavior-name].test.tsx  # Hook tests
    [behavior-name].md              # Behavior specification
```

### Example: Create Project Behavior

```
app/client/home/behaviors/create-project/
+-- actions/
|   +-- create-project.action.ts
|   +-- create-sandbox.action.ts
+-- hooks/
|   +-- use-create-project.ts
+-- workflows/
|   +-- sandbox-creation/
|       +-- sandbox-creation.workflow.ts
|       +-- steps.ts
+-- tests/
|   +-- create-project.spec.ts
|   +-- create-project.action.test.ts
|   +-- use-create-project.test.tsx
+-- create-project.md
```

## Shared Modules

The `shared/` directory contains code used across multiple behaviors. This is for modules that are truly cross-cutting and reused throughout the application.

### shared/models/

Database models using the Active Record pattern:

```
shared/models/
+-- project.ts                    # Project model
+-- issue.ts                      # Issue model
+-- sandbox.ts                    # Sandbox environment model
+-- user.ts                       # User model
+-- page.ts                       # Page model
+-- job.ts                        # Background job model
+-- issue-chat.ts                 # Issue chat history
+-- project-chat.ts               # Project chat history
+-- github-installation.ts        # GitHub installations
+-- vercel-integration.ts         # Vercel integrations
+-- user-subscription.ts          # Subscription data
```

### shared/states/

Global Jotai atoms for application-wide state:

```
shared/states/
+-- ui.state.ts                   # UI state (panels, views)
+-- widget.state.ts               # Widget state
```

### shared/actions/

Server actions used by multiple behaviors:

```
shared/actions/
+-- run-agent-job.action.ts       # Trigger AI agent workflow
+-- start-issue-agent.action.ts   # Start agent on specific issue
+-- get-current-project.action.ts # Get user's current project
+-- set-current-project.action.ts # Set current project
+-- get-project-list.action.ts    # Get project list
```

### shared/hooks/

Reusable client hooks:

```
shared/hooks/
+-- use-upload.ts                 # File upload management
+-- use-state-object.ts           # Jotai state object wrapper
+-- use-project-progress.ts       # Project progress tracking
+-- use-menu-navigation.ts        # Menu navigation state
+-- use-user-projects.ts          # User projects query
```

### shared/workflows/

Inngest workflow definitions used across behaviors:

```
shared/workflows/
+-- agent/                        # AI agent workflow
|   +-- agent.workflow.ts         # Main workflow definition
|   +-- agent-job.class.ts        # Agent job state management
|   +-- steps.ts                  # Workflow step implementations
|   +-- agents/
|       +-- claude.ts             # Claude implementation
|       +-- codex.ts              # OpenAI Codex implementation
```

**Workflows** (formerly called "jobs") are long-running background processes powered by Inngest. They:
- Execute asynchronously outside the request/response cycle
- Support retries, timeouts, and step-based execution
- Can run for extended periods (up to 60 minutes)
- Stream real-time updates via channels

### shared/services/

External integrations and infrastructure services:

```
shared/services/
+-- github/                       # GitHub App OAuth and API
|   +-- github-app.service.ts
+-- inngest/                      # Inngest client configuration
|   +-- inngest.client.ts
+-- morph/                        # MorphCloud SSH sandbox
|   +-- morph-cloud.service.ts
+-- pusher/                       # Real-time updates
|   +-- pusher.ts
|   +-- pusher-client.ts
|   +-- pusher-server.ts
+-- vercel/                       # Vercel deployment API
|   +-- vercel-api.service.ts
+-- stripe/                       # Stripe payments
+-- turso/                        # Turso database service
+-- uploadthing/                  # File uploads
+-- providers/                    # AI provider configuration
    +-- auth-codex/               # OpenAI setup
    +-- auth-claude/              # Anthropic Claude setup
```

### shared/prompts/

AI prompts for agent workflows:

```
shared/prompts/
+-- [system prompts for code generation]
+-- [task-specific prompts]
```

## Layer Details

### Frontend Layer

**Technologies**: React 19, TypeScript, Tailwind CSS, Jotai

**Rules**:
- Components consume hooks (never atoms directly)
- Hooks handle validation, optimistic updates, and action calls
- State managed via Jotai atoms
- No direct database or service calls

**Hook Pattern**:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProjectAction } from '../actions/create-project.action';

export function useCreateProject() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProject = async (data: FormData) => {
    setIsLoading(true);
    const result = await createProjectAction(data.description);
    if (result.success) {
      router.push(`/client/plan/${result.projectId}`);
    }
    setIsLoading(false);
  };

  return { handleCreateProject, isLoading };
}
```

### Backend Layer

**Technologies**: Next.js Server Actions, Inngest

**Rules**:
- All server actions must include `'use server'` directive
- Actions orchestrate models and services
- Workflows handle long-running background tasks
- Can import from Infrastructure layer only

**Action Pattern**:
```typescript
'use server';

import { getUser } from '@/lib/get-user';
import { ProjectModel } from '@/shared/models/project';
import { z } from 'zod';

const schema = z.object({
  description: z.string().min(1)
});

export async function createProjectAction(description: string) {
  const { user } = await getUser();
  if (!user) throw new Error('Unauthorized');

  const validated = schema.parse({ description });
  const project = await ProjectModel.create({
    description: validated.description,
    userId: user.id
  });

  return { success: true, projectId: project.id };
}
```

**Workflow Pattern**:
```typescript
import { getInngestApp } from '@/shared/services/inngest/inngest.client';

const inngest = getInngestApp();

export const sandboxCreation = inngest.createFunction(
  {
    id: 'create-sandbox',
    timeouts: { start: '30s', finish: '5m' },
    retries: 2,
  },
  { event: 'sandbox/setup' },
  async ({ event, step }) => {
    const { projectId, userId } = event.data;

    const instance = await step.run('create-instance', async () => {
      return await createMorphInstance();
    });

    const sandbox = await step.run('save-sandbox', async () => {
      return await saveSandbox(instance, projectId, userId);
    });

    return { success: true, sandboxId: sandbox.id };
  }
);
```

### Infrastructure Layer

**Location**: `/shared/models`, `/shared/services`
**Technologies**: Drizzle ORM, external SDKs

**Rules**:
- Models use Active Record pattern for database operations
- Services wrap external integrations
- No imports from Frontend or Backend layers
- Reusable across entire application

**Model Pattern**:
```typescript
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class ProjectModel {
  static async create(data: CreateProjectInput) {
    const [project] = await db
      .insert(projects)
      .values(data)
      .returning();
    return project;
  }

  static async findById(id: string) {
    return db.query.projects.findFirst({
      where: eq(projects.id, id)
    });
  }

  static async findByUserId(userId: string) {
    return db.query.projects.findMany({
      where: eq(projects.userId, userId)
    });
  }
}
```

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase.tsx | `ProjectCard.tsx` |
| Hooks | use-kebab-case.ts | `use-create-project.ts` |
| Actions | kebab-case.action.ts | `create-project.action.ts` |
| Models | kebab-case.ts | `project.ts` |
| Services | kebab-case.service.ts | `github-app.service.ts` |
| Workflows | kebab-case.workflow.ts | `sandbox-creation.workflow.ts` |
| Unit Tests | *.test.ts | `project.test.ts` |
| E2E Tests | *.spec.ts | `create-project.spec.ts` |
| Hook Tests | use-*.test.tsx | `use-create-project.test.tsx` |
| States | kebab-case.state.ts | `ui.state.ts` |

## Testing

### Test Philosophy

- **Use real database**: Tests run with `NODE_ENV=test` and isolated test database
- **Avoid mocks**: Only mock when absolutely unavoidable
- **Test outcomes**: Focus on what the code does, not how it does it
- **PreDB/PostDB pattern**: Assert database state before and after actions

### Test Types

**E2E Tests (.spec.ts)**:
```typescript
import { test, expect } from '@playwright/test';

test('creates a new project', async ({ page }) => {
  await page.goto('/client/home');
  await page.fill('[data-testid="project-description"]', 'My project');
  await page.click('[data-testid="create-button"]');
  await expect(page).toHaveURL(/\/client\/plan\//);
});
```

**Action Tests (.action.test.ts)**:
```typescript
import { createProjectAction } from '../actions/create-project.action';
import { PreDB, PostDB } from '@/lib/behave-test';

describe('createProjectAction', () => {
  it('creates project with valid data', async () => {
    const preDb = new PreDB();

    const result = await createProjectAction('My project');

    const postDb = new PostDB();
    expect(postDb.projects).toHaveLength(preDb.projects.length + 1);
    expect(result.success).toBe(true);
  });
});
```

## Data Flow Example

Creating a project flows through the architecture:

```
1. User clicks "Create Project" button
   |
   v
2. Component calls useCreateProject hook
   |
   v
3. Hook validates input and calls createProjectAction
   |
   v
4. Action (server) authenticates user via getUser()
   |
   v
5. Action validates with Zod schema
   |
   v
6. Action calls ProjectModel.create()
   |
   v
7. Model executes SQL via Drizzle ORM
   |
   v
8. Action triggers Inngest workflow for background setup
   |
   v
9. Action returns success with projectId
   |
   v
10. Hook navigates to new project page
    |
    v
11. (Background) Workflow creates sandbox, pushes to GitHub
```

## Key Integrations

| Service | Purpose | Location |
|---------|---------|----------|
| **Inngest** | Background workflows | `shared/services/inngest/` |
| **GitHub** | Repository integration | `shared/services/github/` |
| **MorphCloud** | SSH sandboxes | `shared/services/morph/` |
| **Vercel** | Deployments | `shared/services/vercel/` |
| **Stripe** | Payments | `shared/services/stripe/` |
| **Turso** | Production database | `shared/services/turso/` |
| **Pusher** | Real-time updates | `shared/services/pusher/` |
| **OpenAI** | Codex AI agent | `shared/services/providers/` |
| **Anthropic** | Claude AI agent | `shared/services/providers/` |

## When to Use Shared vs Behavior-Specific

**Use shared/ when**:
- Code is used by 3+ behaviors
- It's a core service integration (GitHub, Stripe, etc.)
- It's a utility hook used across pages
- It's a workflow that multiple features trigger

**Keep in behavior/ when**:
- Code is specific to one feature
- It's only used within one page
- It implements behavior-specific business logic
- It's an action that only one component calls

## Commands Reference

```bash
# Development
npm run dev:start        # Start dev server (background)
npm run dev:stop         # Stop dev server
npm run dev:logs         # Stream dev logs

# Database
npm run db:push          # Push schema changes
npm run db:reset         # Full database reset
npm run db:studio        # Open Drizzle Studio

# Testing
npm run test             # Run unit tests
npm run spec             # Run E2E tests
npm run typecheck        # TypeScript checking

# Background Services
npm run inngest:start    # Start Inngest dev server
npm run stripe           # Start Stripe webhook listener
```
