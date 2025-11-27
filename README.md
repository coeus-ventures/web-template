# Web Template

A production-ready [Next.js](https://nextjs.org) application template with authentication, database, testing, and AI-powered tools built-in.

## Features

✨ **Next.js 16** - Latest React framework with App Router
🔐 **Authentication** - Better-auth with session management
🗄️ **Database Ready** - Drizzle ORM + SQLite/Turso with migrations
🧪 **Testing Suite** - Vitest (unit) + Playwright (E2E) + b-test (database testing)
🤖 **AI Integration** - Vercel AI SDK with LLM-powered test assertions
⚡ **Bun** - Fast package manager and runtime
📝 **TypeScript** - Full type safety
🎨 **Tailwind CSS 4** - Utility-first styling
🎭 **shadcn/ui** - Beautiful, accessible components
🔧 **PM2 Ready** - Process management for development

## Tech Stack

### Core
- **Next.js 16.0.0** - React framework with App Router and Turbopack
- **React 19.2.0** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **Bun** - Fast JavaScript runtime and package manager

### Database & Auth
- **Drizzle ORM 0.44** - Type-safe SQL ORM with migrations
- **LibSQL/SQLite** - Embedded database for development/testing
- **Turso** - Serverless database for production (optional)
- **Better Auth 1.3** - Modern authentication library with session management

### Testing
- **Vitest 4** - Fast unit testing framework with jsdom
- **Playwright 1.56** - End-to-end browser testing
- **b-test** - Database testing library (PreDB/PostDB pattern)
- **Tester** - LLM-powered assertions for browser testing
- **Testing Library** - React component testing utilities

### AI/ML
- **Vercel AI SDK 5** - AI integration toolkit
- **OpenAI SDK** - GPT models for LLM-powered test assertions

### UI Components
- **shadcn/ui** - Beautiful, accessible, and customizable React components
- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React** - Beautiful icon library
- **React Hook Form** - Performant form validation
- **Zod 4** - TypeScript-first schema validation

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0.0 or higher
- Node.js 18+ (for Next.js compatibility)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd web-template

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env

# IMPORTANT: Generate a secure secret for Better Auth
# Open .env and set BETTER_AUTH_SECRET to a random string (min 32 characters)
# You can generate one with: openssl rand -base64 32

# Initialize the database
bun run db:generate  # Generate migrations
bun run db:migrate   # Apply migrations

# (Optional) Seed with sample data
bun run db:seed
```

### Development

```bash
# Start development server (default port 8080 with Turbopack)
bun run dev

# Or start with PM2 (managed process)
bun run dev:start

# View logs
bun run dev:logs

# Restart dev server
bun run dev:restart

# Start test environment server (port 3001)
bun run dev:test
```

Open [http://localhost:8080](http://localhost:8080) to view the application.

## Database

### Architecture

This project uses a **Rails-style migration system**:
- Single `db/migrations/` folder for all environments
- Migrations run against dev, test, and production databases
- Tests use in-memory SQLite (`:memory:`) for speed and isolation

### Environment-Based Configuration

| Environment | Database | Location |
|-------------|----------|----------|
| **Development** | SQLite | `file:./db/databases/development.db` |
| **Test** | In-Memory SQLite | `:memory:` (fresh for each test run) |
| **Production** | Turso | `libsql://your-database.turso.io` |

### Database Commands

```bash
# Schema Management
bun run db:push          # Push schema changes (development only)
bun run db:generate      # Generate migration files
bun run db:migrate       # Apply migrations to database

# Database Tools
bun run db:studio        # Open Drizzle Studio (visual editor)
bun run db:seed          # Populate with seed data
bun run db:clean         # Clear all data from database
bun run db:reset         # Clean + push schema (fresh start)

bun run db:squash        # Combine all migrations into one
```

### Schema Definition

Define your database schema in `db/schema.ts`:

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});
```

### Migration Workflow

```bash
# 1. Update schema in db/schema.ts
# 2. Generate migration
bun run db:generate

# 3. Review generated SQL in db/migrations/
# 4. Apply to development database
bun run db:migrate

# 5. Tests automatically use in-memory DB with migrations
bun run test
```

## Testing

### Unit Tests (Vitest)

```bash
bun run test              # Run all unit tests
```

**Features:**
- In-memory SQLite for isolated database tests
- Automatic schema migration before tests
- Database cleanup between tests
- Concurrent test execution (when safe)

### E2E Tests (Playwright)

```bash
bun run spec              # Run Playwright tests
```

**Features:**
- Browser automation (Chromium, Firefox, WebKit)
- Visual testing capabilities
- Network request mocking
- Screenshot/video recording on failure

### Database Testing (b-test)

The `b-test` library provides utilities for deterministic database testing:

```typescript
import { PreDB } from '@/lib/b-test/predb';
import { PostDB } from '@/lib/b-test/postdb';

test('user creation', async () => {
  // Setup: Define expected database state
  await PreDB(db, schema, {
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' }
    ]
  });

  // Action: Your code that modifies the database
  await createUser('Bob', 'bob@example.com');

  // Assert: Verify final database state
  await PostDB(db, schema, {
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ]
  });
});
```

See `lib/b-test/README.md` for full documentation.

## Project Structure

```
.
├── app/                      # Next.js App Router
│   ├── admin/               # Admin pages
│   ├── auth/                # Authentication pages
│   ├── home/                # Home pages
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
├── components/
│   └── ui/                  # shadcn/ui components
├── db/
│   ├── databases/           # SQLite files (gitignored)
│   ├── migrations/          # Migration SQL files
│   │   └── meta/            # Migration metadata
│   ├── scripts/             # Database utilities
│   │   ├── clean.ts         # Clear database
│   │   └── seed.ts          # Seed data
│   ├── schema.ts            # Database schema
│   └── index.ts             # Database client
├── lib/
│   ├── b-test/              # Database testing library
│   │   ├── predb.ts         # Setup database state
│   │   ├── postdb.ts        # Assert database state
│   │   ├── tester.ts        # LLM-powered browser testing
│   │   └── tests/           # b-test test suite
│   ├── auth.ts              # Better-auth configuration
│   ├── auth-client.ts       # Auth client utilities
│   └── utils.ts             # Utility functions
├── scripts/
│   ├── generate-token.ts    # Token generation
│   └── check-token.ts       # Token validation
├── tests/
│   ├── *.spec.ts            # Playwright E2E tests
│   └── *.test.ts            # Vitest unit tests
├── public/                  # Static assets
├── drizzle.config.ts        # Drizzle ORM configuration
├── vitest.config.ts         # Vitest configuration
└── playwright.config.ts     # Playwright configuration
```

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Development Database
DATABASE_URL_DEVELOPMENT="file:./db/databases/development.db"

# Test Database (in-memory for speed)
DATABASE_URL_TEST=":memory:"

# Production Database (Turso - optional)
# DATABASE_URL_PRODUCTION="libsql://your-database.turso.io"
# TURSO_AUTH_TOKEN="your-auth-token"

# Better Auth (REQUIRED)
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET="your-secret-key-here"  # MUST be at least 32 characters
BETTER_AUTH_URL="http://localhost:8080"

# OpenAI (for LLM-powered test assertions)
OPENAI_API_KEY="your-openai-api-key"
```

## Scripts Reference

### Development
- `bun run dev` - Start development server (port 8080 with Turbopack)
- `bun run dev:start` - Start with PM2 (managed process)
- `bun run dev:logs` - View PM2 logs
- `bun run dev:restart` - Restart PM2 dev server
- `bun run dev:test` - Start test environment server (port 3001)
- `bun run lint` - Run ESLint

### Database
- `bun run db:push` - Push schema to database (dev only)
- `bun run db:studio` - Open Drizzle Studio
- `bun run db:generate` - Generate migrations
- `bun run db:migrate` - Run migrations
- `bun run db:seed` - Seed database
- `bun run db:clean` - Clear database
- `bun run db:reset` - Reset database

### Testing
- `bun run test` - Run unit tests (Vitest)
- `bun run spec` - Run E2E tests (Playwright)

### UI Components
- `bun run shadcn:add` - Add shadcn/ui components

## Best Practices

### Database Migrations

1. **Always generate migrations** for schema changes:
   ```bash
   bun run db:generate
   ```

2. **Review generated SQL** before applying:
   ```bash
   cat db/migrations/XXXX_migration_name.sql
   ```

3. **Test migrations** work correctly:
   ```bash
   bun run test
   ```

4. **Commit migrations** to version control

### Testing Database Code

1. Use **PreDB** to set up initial state
2. Run your database operations
3. Use **PostDB** to verify final state
4. Tests automatically use fresh in-memory database

### Authentication

This template uses **Better Auth** for authentication:

1. Configure auth in `lib/auth.ts`
2. Use auth client in components via `lib/auth-client.ts`
3. Protected routes use middleware or server-side checks
4. Session management is built-in

### UI Components

Add shadcn/ui components easily:

```bash
bun run shadcn:add button
bun run shadcn:add form
bun run shadcn:add dialog
```

Components are installed in `components/ui/` and fully customizable.

### Process Management

For production-like development with PM2:

```bash
# Start dev server
bun run dev:start

# Monitor logs
bun run dev:logs

# Restart services
bun run dev:restart

# Stop all
bun run dev:stop
```

### Package Management

This project uses **Bun** exclusively:
- ✅ `bun.lock` - Committed to git
- ❌ `package-lock.json` - Gitignored (npm)
- ❌ `yarn.lock` - Gitignored (yarn)
- ❌ `pnpm-lock.yaml` - Gitignored (pnpm)

Always use `bun add/remove` for dependencies.
