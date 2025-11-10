import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { SQLiteTable, type TableConfig } from 'drizzle-orm/sqlite-core';
import * as schema from '../schema';
import { db } from '../index';

async function cleanDatabase() {
  try {
    console.log('Cleaning database tables...');

    // Disable foreign key constraints temporarily
    await db.run(sql`PRAGMA foreign_keys = OFF`);

    // Get all table objects from the schema dynamically
    const tableEntries = Object.entries(schema).filter(([key, value]) => {
      return (
        !key.startsWith('Insert') &&
        !key.startsWith('Select') &&
        value &&
        typeof value === 'object' &&
        'getSQL' in value
      );
    });

    console.log(
      `Found ${tableEntries.length} tables:`,
      tableEntries.map(([name]) => name)
    );

    // Delete from all tables in reverse order
    const reversedTables = [...tableEntries].reverse();

    for (const [tableName, table] of reversedTables) {
      try {
        await db.delete(table as SQLiteTable<TableConfig>);
        console.log(`✓ Cleared table: ${tableName}`);
      } catch (error) {
        // Silently skip tables that don't exist (database not initialized)
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorCause = error instanceof Error && error.cause ? String(error.cause) : '';

        if (errorMsg.includes('no such table') || errorCause.includes('no such table')) {
          console.log(`⊘ Skipped ${tableName} (table does not exist)`);
        } else {
          console.log(`⚠️  Could not clear table ${tableName}:`, error);
        }
      }
    }

    // Reset auto-increment counters
    try {
      await db.run(sql`DELETE FROM sqlite_sequence`);
      console.log('✓ Reset auto-increment counters');
    } catch {
      console.log('ℹ️  No auto-increment counters to reset');
    }

    // Re-enable foreign key constraints
    await db.run(sql`PRAGMA foreign_keys = ON`);

    console.log('✅ Database cleaned successfully!');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

cleanDatabase();
