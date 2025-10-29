# Agents

A [Next.js](https://nextjs.org) project with [Drizzle ORM](https://orm.drizzle.team/) and SQLite database integration.

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Type-safe ORM
- **SQLite** - Local development database
- **Turso** - Production database (optional)
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **Bun** - Package manager and runtime

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine

### Installation

1. Clone the repository
2. Install dependencies:

```bash
bun install
```

3. Copy the environment variables:

```bash
cp .env.example .env
```

4. Initialize the database:

```bash
bun run db:push
```

5. (Optional) Seed the database with sample data:

```bash
bun run db:seed
```

### Development

Run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Commands

```bash
bun run db:push          # Push schema changes to database
bun run db:studio        # Open Drizzle Studio (visual editor)
bun run db:generate      # Generate migration files
bun run db:migrate       # Run migrations
bun run db:seed          # Populate with seed data
bun run db:clean         # Clear all data from database
bun run db:reset         # Clean + push schema (fresh start)
```

## Testing

```bash
bun run test             # Run unit tests with Vitest
bun run spec             # Run E2E tests with Playwright
```

## Project Structure

```
.
├── app/                 # Next.js app directory
├── db/
│   ├── databases/       # SQLite database files (gitignored)
│   ├── scripts/         # Database utility scripts
│   ├── schema.ts        # Database schema definitions
│   └── index.ts         # Database client configuration
├── tests/               # Test files
└── public/              # Static assets
```

## Database Configuration

This project uses environment-based database configuration:

- **Development**: Local SQLite file (`db/databases/development.db`)
- **Test**: Separate SQLite file (`db/databases/test.db`)
- **Production**: Turso (hosted libSQL) - configure in `.env`

See `drizzle-sqlite-configuration.md` for detailed setup instructions.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Bun Documentation](https://bun.sh/docs)
