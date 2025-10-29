# Web Template

A modern [Next.js](https://nextjs.org) starter template with database, testing, and AI-powered tools built-in.

## Features

✨ **Next.js 16** - Latest React framework with App Router
🗄️ **Database Ready** - Drizzle ORM + SQLite/Turso with migrations
🧪 **Testing Suite** - Vitest (unit) + Playwright (E2E) + b-test (database testing)
🤖 **AI Integration** - Vercel AI SDK with testing utilities
⚡ **Bun** - Fast package manager and runtime
📝 **TypeScript** - Full type safety
🎨 **Tailwind CSS** - Utility-first styling

## Tech Stack

### Core
- **Next.js 16.0.0** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Bun** - Fast JavaScript runtime and package manager

### Database
- **Drizzle ORM** - Type-safe SQL ORM
- **LibSQL/SQLite** - Embedded database for development/testing
- **Turso** - Serverless database for production (optional)

### Testing
- **Vitest 4** - Fast unit testing framework
- **Playwright** - End-to-end browser testing
- **b-test** - Custom database testing library (PreDB/PostDB)
- **Tester** - AI-powered browser testing utilities

### AI/ML
- **Vercel AI SDK** - AI integration toolkit
- **OpenAI** - GPT models for testing assertions

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

# Initialize the database
bun run db:generate  # Generate migrations
bun run db:migrate   # Apply migrations

# (Optional) Seed with sample data
bun run db:seed
```

### Development

```bash
# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
# Create production build
bun run build

# Start production server
bun run start
```

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

# Migration Squashing (see db/SQUASHING_QUICK_START.md)
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

### Migration Squashing

When you accumulate too many migrations (50+), squash them for faster test startup:

```bash
bun run db:squash  # Combines all migrations into one
```

See `db/SQUASHING_QUICK_START.md` for detailed instructions.

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
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
├── db/
│   ├── databases/           # SQLite files (gitignored)
│   ├── migrations/          # Migration SQL files
│   │   └── meta/            # Migration metadata
│   ├── scripts/             # Database utilities
│   │   ├── clean.ts         # Clear database
│   │   ├── seed.ts          # Seed data
│   │   └── squash.ts        # Migration squashing
│   ├── schema.ts            # Database schema
│   └── index.ts             # Database client
├── lib/
│   └── b-test/              # Database testing library
│       ├── predb.ts         # Setup database state
│       ├── postdb.ts        # Assert database state
│       ├── tester.ts        # AI-powered browser testing
│       └── tests/           # b-test test suite
├── tests/
│   ├── example.spec.ts      # Playwright tests
│   └── example.test.ts      # Vitest tests
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
```

## Scripts Reference

### Development
- `bun run dev` - Start development server
- `bun run build` - Create production build
- `bun run start` - Start production server
- `bun run lint` - Run ESLint

### Database
- `bun run db:push` - Push schema to database (dev only)
- `bun run db:studio` - Open Drizzle Studio
- `bun run db:generate` - Generate migrations
- `bun run db:migrate` - Run migrations
- `bun run db:seed` - Seed database
- `bun run db:clean` - Clear database
- `bun run db:reset` - Reset database
- `bun run db:squash` - Squash migrations

### Testing
- `bun run test` - Run unit tests (Vitest)
- `bun run spec` - Run E2E tests (Playwright)

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

5. **Squash old migrations** when you have 50+:
   ```bash
   bun run db:squash
   ```

### Testing Database Code

1. Use **PreDB** to set up initial state
2. Run your database operations
3. Use **PostDB** to verify final state
4. Tests automatically use fresh in-memory database

### Package Management

This project uses **Bun** exclusively:
- ✅ `bun.lock` - Committed to git
- ❌ `package-lock.json` - Gitignored (npm)
- ❌ `yarn.lock` - Gitignored (yarn)
- ❌ `pnpm-lock.yaml` - Gitignored (pnpm)

Always use `bun add/remove` for dependencies.
