# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

This is a **behave.js** application using a **two-layer architecture**:

```
Frontend (Browser) → Backend (Server)
```

### Frontend Layer
- **Components**: Render UI, collect user input, consume custom hooks
- **Hooks**: Validate input (Zod), manage state (Jotai), optimistic updates, call server actions
- **May import**: React, Zod, Jotai, Actions
- **Must NOT import**: Database clients, Drizzle, server-only code

### Backend Layer
- **Actions**: Auth-aware business logic, direct Drizzle queries, external API calls
- **Routes**: API endpoints and server-side routing
- **Services**: External integrations, complex business logic
- **May import**: Drizzle/SQL client, Services, external APIs, auth/context utilities
- **Must NOT import**: React, `window`, Jotai atoms

### One-Way Data Flow
- Backend never calls Frontend (Actions/Routes don't call Hooks/Components)
- Frontend Components never contain server code or manage atoms directly
- Frontend Hooks never touch the database directly

## Database Architecture

**Rails-style migration system** with environment-based configuration:

- **Development**: SQLite at `file:./db/databases/development.db`
- **Test**: In-memory SQLite (`:memory:`) - fresh for each test run, automatic migration via `vitest.setup.ts`
- **Production**: Turso (optional serverless)

**Schema definition**: `db/schema.ts` using Drizzle ORM
**Database client**: `db/index.ts` with HMR-safe global caching

### Database Commands
```bash
bun run db:generate      # Generate migration files
bun run db:migrate       # Apply migrations
bun run db:push          # Push schema (development only)
bun run db:studio        # Visual database editor
bun run db:seed          # Populate seed data
bun run db:clean         # Clear all data
bun run db:reset         # Clean + push schema
bun run db:squash        # Combine migrations
```

## Development Commands

```bash
# Development servers
bun run dev              # Port 8080 with Turbopack
bun run dev:start        # PM2: dev server + drizzle gateway
bun run dev:logs         # View PM2 logs
bun run dev:restart      # Restart PM2 dev server
bun run lint             # ESLint

# Testing
bun run test             # Vitest unit tests
bun run spec             # Playwright E2E tests

# UI Components (shadcn/ui)
bun run shadcn:add button    # Add components
```

## Testing Philosophy

**Test real code with real database, minimal mocking.**

### Vitest (Unit Tests)
- Two projects: "unit" (Node) and "react" (jsdom)
- In-memory SQLite for database tests
- Automatic schema migration before tests
- File patterns:
  - Unit: `**/*.test.{ts,js}`, `**/*.unit.{ts,js}`, `**/*.integration.{ts,js}`
  - React: `**/*.test.tsx`, `**/*.spec.tsx`

### Playwright (E2E Tests)
- Base URL: `http://localhost:3000`
- File pattern: `**/*.spec.ts`
- Chromium only (expandable)
- Auto-start dev server

### b-test Library (`lib/b-test/`)
Custom database testing utilities:

**PreDB** - Deterministic database setup:
```typescript
await PreDB(db, schema, {
  users: [{ id: 1, name: 'Alice', email: 'alice@example.com' }]
});
```

**PostDB** - Database state assertion:
```typescript
await PostDB(db, schema, {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ]
});
```

**Tester** - LLM-powered browser testing with HTML snapshot capture and natural language assertions.

### Testing Rules
- **NO mocking in Playwright tests** - use real navigation
- **NO `toHaveBeenCalled`** - test outcomes, not implementation
- **USE test database** - not mocks for DB operations
- **Start with ONE test** - expand later if needed
- **PreDB/PostDB pattern** - for deterministic state

## Project Structure

### Behavior-Centric Organization

Each feature follows a "behavior" structure:

```
app/[page]/behaviors/[behavior-name]/
  [behavior-name].action.ts    # Server action
  use-[behavior-name].ts        # React hook
  tests/
    [behavior-name].spec.ts           # E2E test
    [behavior-name].action.test.ts    # Action test
    use-[behavior-name].test.tsx      # Hook test
```

### Key Directories

```
app/
  /(landing-page)/     # Route group for public landing pages (NO login required)
    /page.tsx          # Landing page
    /about/            # About page
    /pricing/          # Pricing page
  /(app)/              # Route group for authenticated app (LOGIN REQUIRED)
    /home/             # Home page
    /dashboard/        # Dashboard
    /settings/         # User settings
  /admin/              # Admin area (LOGIN REQUIRED)
  /auth/               # Authentication pages (signin, signup, etc.)
  /api/                # API routes
db/                    # Database layer
  /migrations/         # SQL migrations
  schema.ts            # Drizzle schema
  index.ts             # DB client
lib/                   # Shared libraries
  /b-test/            # Testing utilities
  auth.ts             # Auth config
  auth-client.ts      # Auth client
models/                # Data models
services/              # Business logic services
components/            # Shared components
  /ui/                # shadcn/ui components
docs/                  # Documentation
  /templates/         # Doc templates
  /agents/            # Agent templates
.claude/               # Claude Code extensions
  /agents/            # AI agents
  /commands/          # Slash commands
  /skills/            # AI skills
```

## File Naming Conventions

- **Server actions**: `[name].action.ts` (start with `'use server'`)
- **React hooks**: `use-[name].ts` (export hook with `handle[Name]` function)
- **Components**: `[Name].tsx` (PascalCase for component files)
- **E2E tests**: `[name].spec.ts`
- **Action tests**: `[name].action.test.ts`
- **Hook tests**: `use-[name].test.tsx`
- **State files**: `state.ts` (Jotai atoms, sibling to `page.tsx`)
- **Page folders**: singular to match route segments

## Route Groups & Authentication

The app uses Next.js route groups to separate public and authenticated areas:

### `/(landing-page)/` - Public Routes (NO login required)
- Landing page, marketing pages, pricing, about, etc.
- Accessible to all users without authentication
- Examples: `/`, `/about`, `/pricing`, `/features`

### `/(app)/` - Authenticated Routes (LOGIN REQUIRED)
- Main application pages requiring user authentication
- Protected by middleware - redirects to `/auth/signin` if not logged in
- Examples: `/home`, `/dashboard`, `/settings`, `/profile`

### `/admin` - Admin Routes (LOGIN REQUIRED + ADMIN ROLE)
- Administrative pages requiring authentication and admin role
- Role-based access control via Better Auth admin plugin

### `/auth` - Authentication Pages (NO login required)
- Sign in, sign up, password reset, magic link, token login
- Accessible to unauthenticated users

## Authentication

**Better Auth 1.3** with session management:

- Configuration: `lib/auth.ts`
- Client: `lib/auth-client.ts`
- Middleware: `middleware.ts` (protects `/(app)/` routes and `/admin`)
- Server-side session: `getUser()` - cached session retrieval

**Features**:
- Email/password authentication
- Magic link plugin with custom URL capture
- Admin plugin with role-based access
- Session cookie caching (24 hour maxAge)
- One-time login tokens (TokenService)

**Middleware Protection**:
- Excludes: `/`, `/(landing-page)/*`, `/auth/*`, `/api/*`, `/_next/*`, `/public/*`
- Protects: `/(app)/*`, `/admin/*`
- Uses optimistic redirect with `getSessionCookie()` (not cryptographically secure - always verify in routes/pages)

## Code Patterns

### Server Actions (Backend)

Actions use **direct Drizzle queries** (no Model layer):

```typescript
'use server';

import { z } from 'zod';
import { db } from '@/db';
import { tasks } from '@/db/schema';

const input = z.object({ title: z.string() });

export async function createTask(data: unknown) {
  const { title } = input.parse(data);

  const [row] = await db
    .insert(tasks)
    .values({
      id: crypto.randomUUID(),
      title,
      completed: false
    })
    .returning();

  return row;
}
```

### React Hooks (Frontend)

Hooks export a **single handler function** as the main entry point:

```typescript
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useSetAtom } from 'jotai';
import { tasksAtom } from '../state';
import { createTask } from './create-task.action';

const titleSchema = z.string().min(1, 'Title is required');

export function useCreateTask() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setTasks = useSetAtom(tasksAtom);

  // Main handler function (handle prefix)
  const handleCreateTask = async (rawTitle: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const title = titleSchema.parse(rawTitle.trim());

      // Optimistic update
      const tmp = { id: '', title, completed: false, pending: true };
      setTasks((prev) => [tmp, ...prev]);

      const created = await createTask({ title });
      setTasks((prev) => prev.map((t) => (t === tmp ? created : t)));
    } catch (err) {
      setTasks((prev) => prev.filter((t) => !t.pending)); // Rollback
      setError(err instanceof Error ? err.message : 'Failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { handleCreateTask, isLoading, error };
}
```

**Hook Naming Conventions**:
- Main handler: `handle[Name]` (e.g., `handleCreateTask`, `handleDeleteTask`)
- Event functions: `on[Event]` (e.g., `onReset`, `onCancel`, `onValidate`)

### Services (Backend)

Services are objects with static methods (not classes):

```typescript
export const TokenService = {
  async issueOneTimeLoginToken(email, callbackUrl, uaHash): Promise<string> {
    // Implementation
  },
  async validateAndConsume(token, uaHash): Promise<TokenData | null> {
    // Implementation
  }
};
```

### Models (Optional)

Models provide Active Record-style methods:

```typescript
class UserModel {
  static async find(id: string): Promise<User | null>
  static async where(attributes: Partial<SelectUser>): Promise<User[]>
  async save(): Promise<User>
  async update(attributes: Partial<User>): Promise<User>
}
```

## Path Aliases

- `@/*` - Project root
- `@/db` - Database
- `@/lib` - Libraries

## Package Management

**Use Bun exclusively**:
- `bun add [package]` - Add dependency
- `bun remove [package]` - Remove dependency
- `bun.lock` - Committed to git
- Other lock files (npm, yarn, pnpm) - Gitignored

## Environment Variables

```bash
# Development Database
DATABASE_URL_DEVELOPMENT="file:./db/databases/development.db"

# Test Database (in-memory)
DATABASE_URL_TEST=":memory:"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:8080"

# OpenAI (for LLM-powered test assertions)
OPENAI_API_KEY="your-openai-api-key"

# Optional
DRIZZLE_GATEWAY_TOKEN="your-gateway-token"
```

## Important Documentation

- `docs/templates/architecture.md` - Complete architecture guide with examples
- `docs/templates/spec.md` - Behavior specification format
- `docs/templates/issue.md` - Issue creation template
- `lib/b-test/README.md` - Database testing library docs
- `README.md` - Setup and getting started

## Claude Code Extensions

### Agents (`.claude/agents/`)
- `test-writer.md` - Generates behavior, action, and hook tests
- `action-writer.md` - Creates server actions
- `component-writer.md` - Builds React components
- `service-writer.md` - Implements services
- `model-writer.md` - Creates data models
- `route-writer.md` - Builds API routes
- `hook-writer.md` - Creates React hooks

### Commands (`.claude/commands/`)
- `/execute @docs/issues/[issue-file].md` - Execute an issue following Behave.js architecture
- `/build` - Build all issues in sequence from docs/issues/
- `/spec [project description]` - Create project spec with MVP pages and behaviors
- `/plan @docs/issues/[issue-file].md` - Update issue file with detailed implementation plan
- `/run @docs/issues/[issue-file].md` - Complete an issue by planning and implementing it
- `/document path/to/behavior/directory` - Document a behavior by analyzing its implementation
- `/break @SPEC.md` - Break spec into individual implementation issues

### Skills (`.claude/skills/`)
- `create-skill` - Guide for creating effective skills
- `pdf` - PDF manipulation toolkit
- `write-issue` - Create or update project issues
- `write-unit-test` - Generate behavioral unit tests from functional specs

## Key Architectural Decisions

1. **Two-layer architecture** - Frontend and Backend only (no separate Infrastructure layer)
2. **Direct Drizzle queries** - Actions query database directly (no Model layer required)
3. **Behavior-centric organization** - Features grouped by behavior, not by file type
4. **In-memory test DB** - Fast, isolated test execution
5. **Minimal mocking** - Prefer real implementations in tests
6. **Rails-style migrations** - Single folder for all environments
7. **Optimistic updates** - Immediate UI feedback with rollback on error
8. **Type safety** - Full TypeScript with strict mode
9. **Better Auth over NextAuth** - Modern, flexible authentication
10. **Bun over npm/yarn** - Fast package management and runtime
