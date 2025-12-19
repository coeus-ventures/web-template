# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Architecture

**Three-layer architecture** with one-way data flow (top to bottom only):

| Layer | Runs On | Components | May Import | Must NOT Import |
|-------|---------|------------|------------|-----------------|
| **Frontend** | Browser | Components, Hooks, States | React, Zod, Jotai, Actions | Drizzle, Integrations, server-only |
| **Backend** | Server | Actions, Routes | Integrations, auth utilities | React, Jotai, direct DB access |
| **Infrastructure** | Server | Integrations, Models | Drizzle, external APIs | React, Actions, Hooks |

See `docs/references/architecture.md` for detailed patterns and code examples.

## Project Structure

```
app/
  /(landing-page)/     # Public pages (NO auth)
  /(app)/              # Authenticated pages (LOGIN REQUIRED)
  /admin/              # Admin pages (LOGIN + ADMIN ROLE)
  /auth/               # Auth pages (signin, signup, etc.)
  /api/                # API routes
db/                    # Schema + migrations
lib/                   # Utilities, auth, testing libs
shared/                # Models + Integrations
components/ui/         # shadcn/ui components
```

### Behavior Structure

Features are organized by behavior:

```
app/[page]/behaviors/[behavior-name]/
  [behavior-name].action.ts      # Server action (atomic)
  route.ts                       # Route endpoint (streaming)
  use-[behavior-name].ts         # React hook
  state.ts                       # Behavior-specific state (optional)
  tests/
    [behavior-name].spec.ts      # E2E test
    [behavior-name].action.test.ts
    [behavior-name].route.test.ts
```

A behavior has either an action OR a route, not both.

## File Naming

| Type | Pattern |
|------|---------|
| Server actions | `[name].action.ts` |
| Routes | `route.ts` |
| React hooks | `use-[name].ts` |
| Components | `[Name].tsx` |
| E2E tests | `[name].spec.ts` |
| Action tests | `[name].action.test.ts` |
| Route tests | `[name].route.test.ts` |
| State files | `state.ts` |

## Commands

```bash
# Development
bun run dev              # Start dev server (port 8080)
bun run lint             # ESLint

# Database
bun run db:generate      # Generate migrations
bun run db:migrate       # Apply migrations
bun run db:push          # Push schema (dev only)
bun run db:studio        # Visual editor
bun run db:reset         # Clean + push schema
bun run db:squash        # Combine migrations into one

# Testing
bun run test             # Vitest unit tests
bun run spec             # Playwright E2E tests
```

## Testing

**Philosophy**: Test real code with real database, minimal mocking.

**Rules**:
- NO mocking in Playwright tests
- NO `toHaveBeenCalled` - test outcomes, not implementation
- USE test database, not mocks
- Start with ONE test, expand later
- Use PreDB/PostDB for deterministic state

```typescript
// Database test pattern
await PreDB(db, schema, { users: [] });
// ... execute action ...
await PostDB(db, schema, { users: [{ name: 'Alice' }] });
```

## Authentication

**Better Auth** with middleware protection:
- `/(app)/*` and `/admin/*` require authentication
- Config: `lib/auth/index.ts`, Client: `lib/auth/client.ts`
- Server-side: `getUser()` for cached session retrieval

## Package Management

Use **Bun** exclusively: `bun add`, `bun remove`
