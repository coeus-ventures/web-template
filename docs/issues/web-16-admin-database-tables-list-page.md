# WEB-16 Admin Database Tables List Page

The main admin database page that displays a list of all available database tables extracted from the Drizzle schema, allowing administrators to navigate to individual table views.

# Functional Specification

## Behavior: List Tables
Directory: `app/admin/database/behaviors/list-tables/`

Displays all database tables from the Drizzle schema as a grid of cards, each showing table metadata and providing navigation to the table view.

* User is authenticated as admin
* Database schema is defined in `db/schema.ts`

### View Tables List

#### Preconditions
- Drizzle schema contains tables: users, sessions, accounts, verifications

#### Workflow
* User is logged in as admin
* Navigate to "/admin/database"
* Page displays grid of table cards
* Each card shows: table name, row count
* Cards are clickable links to `/admin/database/[tableName]`

#### Postconditions
- No database changes (read-only operation)

### Navigate to Table View

#### Workflow
* User views tables list at "/admin/database"
* User clicks on "users" table card
* User is redirected to "/admin/database/users"
* Table view page loads with users data

---

## Behavior: Refresh Stats
Directory: `app/admin/database/behaviors/refresh-stats/`

Allows user to refresh the row counts for all tables.

### Refresh Table Statistics

#### Workflow
* User is on "/admin/database"
* User clicks refresh button
* Loading state appears
* Row counts are fetched fresh from database
* Cards update with new counts

# Technical Specification

## Utility: Schema Introspection
File: `app/admin/database/lib/schema-introspection.ts`

Extracts table metadata from the Drizzle schema for dynamic UI generation.

### Functions

**getTableNames()**: `string[]`
- Imports schema from `db/schema.ts`
- Returns array of all table names

**getTableMetadata(tableName: string)**: `TableMetadata`
- Returns column definitions, types, constraints for a table
- Maps Drizzle types to UI-friendly type names

**getTableRowCount(tableName: string)**: `Promise<number>`
- Executes COUNT query on the specified table
- Returns total row count

---

## Action: fetch-tables
File: `app/admin/database/behaviors/list-tables/fetch-tables.action.ts`
Input: `{}`
Returns: `Promise<TableInfo[]>`

Fetches all table names and their row counts from the database.

### Primary Use Case

* Calls getTableNames() to get all tables
* For each table, calls getTableRowCount()
* Returns array of { name, rowCount }

---

## Hook: use-list-tables
File: `app/admin/database/behaviors/list-tables/use-list-tables.ts`
Returns: `{ tables, isLoading, error, handleRefresh }`

Manages the tables list state and refresh functionality.

### Primary Use Case

* Fetches tables on mount via fetchTables action
* Stores result in local state
* handleRefresh re-fetches and updates state

---

## Component: TableList
File: `app/admin/database/components/table-list.tsx`
Props: `{ tables: TableInfo[], isLoading: boolean }`

Renders a responsive grid of table cards.

### Primary Use Case

* Maps tables array to TableCard components
* Shows skeleton cards during loading
* Displays empty state if no tables

---

## Component: TableCard
File: `app/admin/database/components/table-card.tsx`
Props: `{ name: string, rowCount: number }`

Displays individual table information as a clickable card.

### Primary Use Case

* Shows table name as heading
* Shows row count with label
* Entire card is a Link to `/admin/database/[name]`
* Hover state indicates clickability

---

## Component: RefreshButton
File: `app/admin/database/components/refresh-button.tsx`
Props: `{ onRefresh: () => void, isLoading: boolean }`

Button to trigger stats refresh.

### Primary Use Case

* Renders refresh icon button
* Shows spinner when isLoading
* Calls onRefresh when clicked

# Tasks

* [ ] Create schema introspection utility
* [ ] Implement fetch-tables action
* [ ] Create use-list-tables hook
* [ ] Build TableList component
* [ ] Build TableCard component
* [ ] Build RefreshButton component
* [ ] Create page at app/admin/database/page.tsx
* [ ] Add tests for schema introspection
* [ ] Add tests for fetch-tables action

# Notes

- Schema introspection will be reused by WEB-17 for the table view page
- The introspection utility needs to handle all Drizzle column types used in the schema
- Consider caching table metadata since schema doesn't change at runtime
