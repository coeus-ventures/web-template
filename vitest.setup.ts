import '@testing-library/jest-dom/vitest';
import { config } from 'dotenv';

// Load environment variables
config();

// Only add browser API mocks when in a JSDOM environment
// This ensures we don't try to mock browser APIs in Node tests
if (typeof window !== 'undefined') {
  // Mock browser APIs that JSDOM doesn't provide
  if (!global.ResizeObserver) {
    global.ResizeObserver = class ResizeObserver {
      constructor(callback: any) {}
      observe() {
        return null;
      }
      unobserve() {
        return null;
      }
      disconnect() {
        return null;
      }
    };
  }

  // Mock scrollIntoView - jsdom doesn't implement this
  // Force override since jsdom might have a broken implementation
  if (typeof Element !== 'undefined') {
    Element.prototype.scrollIntoView = function (
      options?: boolean | ScrollIntoViewOptions
    ) {
      // Mock implementation - just return null for tests
      return null;
    };
  }

  // Also mock it on HTMLElement specifically
  if (typeof HTMLElement !== 'undefined') {
    HTMLElement.prototype.scrollIntoView = function (
      options?: boolean | ScrollIntoViewOptions
    ) {
      return null;
    };
  }

  // Mock other common browser APIs as needed
  global.matchMedia =
    global.matchMedia ||
    function () {
      return {
        matches: false,
        addListener: function () {},
        removeListener: function () {},
        addEventListener: function () {},
        removeEventListener: function () {},
        dispatchEvent: function () {
          return false;
        },
      };
    };
}

// Database cleanup for tests
import { beforeEach } from 'vitest';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// Clean database before each test
beforeEach(async () => {
  // Get all table names
  const tables = await db.all(sql`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `);

  // Disable foreign keys and clear all tables
  await db.run(sql`PRAGMA foreign_keys = OFF`);

  for (const { name } of tables) {
    await db.run(sql.raw(`DELETE FROM ${name}`));
  }

  await db.run(sql`PRAGMA foreign_keys = ON`);
});

