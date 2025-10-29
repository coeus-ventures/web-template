/**
 * Squash Drizzle migrations
 *
 * Usage:
 *   npm run db:squash                      # Delete all migrations, regenerate
 *   bun db/scripts/squash.ts --all         # Same as above
 *   bun db/scripts/squash.ts --after 0010  # Delete migrations after 0010
 *
 * Based on community script from:
 * https://github.com/drizzle-team/drizzle-orm/discussions/3492
 */

import { glob } from 'glob';
import { rm, writeFile, mkdir } from 'fs/promises';
import { parseArgs } from 'util';
import { basename, dirname, join } from 'path';
import journalData from '../migrations/meta/_journal.json';

// Parse migration number from filename (e.g., "0001_lumpy_meltdown" -> 1)
function parseMigrationNumber(name: string): number {
  const migrationNumberRaw = name.split('_')[0];
  const result = Number.parseInt(migrationNumberRaw ?? '');

  if (Number.isNaN(result)) {
    throw new Error(
      'Please provide a migration name in this shape: 0001_my_migration'
    );
  }

  return result;
}

// Get list of migrations to squash
function getMigrationsToSquash(
  filePaths: string[],
  afterMigrationName?: string
) {
  const afterNumber = afterMigrationName
    ? parseMigrationNumber(afterMigrationName)
    : -1;

  const names: string[] = [];
  const migrationPaths: string[] = [];
  const snapshotPaths: string[] = [];

  for (const filePath of filePaths) {
    const name = basename(filePath, '.sql');
    const migrationNumber = parseMigrationNumber(name);

    // Skip migrations at or before the specified point
    if (migrationNumber <= afterNumber) {
      continue;
    }

    names.push(name);
    migrationPaths.push(filePath);

    // Also track snapshot files
    const migrationNumberRaw = name.split('_')[0];
    const migrationsDirectory = dirname(filePath);
    const snapshotName = `${migrationNumberRaw}_snapshot.json`;
    const snapshotPath = join(migrationsDirectory, 'meta', snapshotName);
    snapshotPaths.push(snapshotPath);
  }

  return { names, migrationPaths, snapshotPaths };
}

// Main script
async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      after: {
        type: 'string',
        description: 'Delete migrations after this one (e.g., 0010_migration_name)',
      },
      all: {
        type: 'boolean',
        description: 'Delete all migrations and regenerate from scratch',
      },
    },
    strict: true,
    allowPositionals: false,
  });

  console.log('🔨 Squashing migrations...\n');

  if (values.after) {
    console.log(`📌 Keeping migrations up to: ${values.after}`);
    console.log('🗑️  Deleting migrations after this point...\n');

    // Get all migration files
    const filePaths = await glob('./db/migrations/*.sql');

    // Determine which to squash
    const toSquash = getMigrationsToSquash(filePaths, values.after);

    console.log(`Found ${toSquash.names.length} migrations to delete:`);
    toSquash.names.forEach((name) => console.log(`  - ${name}`));
    console.log('');

    // Update journal to remove squashed entries
    const newEntries = journalData.entries.filter(
      (entry: any) => !toSquash.names.includes(entry.tag)
    );

    const newJournal = JSON.stringify(
      { ...journalData, entries: newEntries },
      null,
      2
    );

    await writeFile('./db/migrations/meta/_journal.json', newJournal);
    console.log('✅ Updated journal\n');

    // Delete migration SQL files
    for (const filePath of toSquash.migrationPaths) {
      await rm(filePath);
    }
    console.log(`✅ Deleted ${toSquash.migrationPaths.length} migration files\n`);

    // Delete snapshot files
    for (const filePath of toSquash.snapshotPaths) {
      await rm(filePath).catch(() => {}); // Ignore if doesn't exist
    }
    console.log(`✅ Deleted ${toSquash.snapshotPaths.length} snapshot files\n`);

  } else if (values.all) {
    console.log('🗑️  Deleting ALL migrations...\n');

    // Remove entire migrations folder
    await rm('db/migrations', { recursive: true, force: true });
    await mkdir('db/migrations');

    console.log('✅ All migrations deleted\n');
  } else {
    console.error('❌ Please specify --after <migration> or --all');
    process.exit(1);
  }

  console.log('✨ Done! Next steps:');
  console.log('  1. npm run db:generate  # Generate fresh migration from current schema');
  console.log('  2. Reset your databases (dev/test/prod) to apply the squashed migration');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
