# WEB-17 Admin Database Table View Page

A spreadsheet-like interface for viewing and managing data in a specific database table, with full CRUD capabilities, sorting, filtering, and pagination.

**Depends on:** WEB-16 (schema introspection utility)

# Functional Specification

## Behavior: View Table Data
Directory: `app/admin/database/[tableName]/behaviors/view-table/`

Displays table data in a spreadsheet-like grid with sorting, filtering, and pagination.

* User is authenticated as admin
* Table exists in Drizzle schema

### View Table with Pagination

#### Preconditions
users:
id, email, name, created_at
1, alice@example.com, Alice, 2024-01-01
2, bob@example.com, Bob, 2024-01-02
... (25 total rows)

#### Workflow
* User navigates to "/admin/database/users"
* DataTable displays first 10 rows
* Pagination shows "Page 1 of 3"
* User clicks "Next" button
* Table displays rows 11-20
* Pagination shows "Page 2 of 3"

### Sort Column

#### Workflow
* User views table at "/admin/database/users"
* User clicks "email" column header
* Table sorts by email ascending (arrow up indicator)
* User clicks "email" header again
* Table sorts by email descending (arrow down indicator)
* User clicks "email" header third time
* Sort is removed (no indicator)

### Filter Rows

#### Workflow
* User views table with 25 rows
* User types "alice" in search input
* Table filters to show only rows where any text column contains "alice"
* Row count updates to show filtered count

### Toggle Column Visibility

#### Workflow
* User views table with columns: id, email, name, created_at
* User opens column visibility dropdown
* User unchecks "created_at"
* Column disappears from table
* User checks "created_at"
* Column reappears

---

## Behavior: Add Row
Directory: `app/admin/database/[tableName]/behaviors/add-row/`

Allows creating new records via a dialog form.

### Add New Record

#### Preconditions
users:
id, email, name
1, alice@example.com, Alice

#### Workflow
* User clicks "Add Row" button
* Dialog opens with form fields for each column
* Required fields are marked with asterisk
* User fills in: email="charlie@example.com", name="Charlie"
* User clicks "Save"
* Dialog closes
* New row appears in table (optimistic update)
* Success toast appears

#### Postconditions
users:
id, email, name
1, alice@example.com, Alice
2, charlie@example.com, Charlie

---

## Behavior: Edit Row
Directory: `app/admin/database/[tableName]/behaviors/edit-row/`

Allows editing existing records via dialog or inline.

### Edit via Dialog

#### Preconditions
users:
id, email, name
1, alice@example.com, Alice

#### Workflow
* User clicks row actions menu on Alice's row
* User clicks "Edit"
* Dialog opens with pre-filled form
* User changes name to "Alice Smith"
* User clicks "Save"
* Dialog closes
* Row updates in table (optimistic update)

#### Postconditions
users:
id, email, name
1, alice@example.com, Alice Smith

### Edit Cell Inline

#### Workflow
* User double-clicks on "Alice" in name column
* Cell becomes editable input
* User types "Alice Smith"
* User presses Enter
* Cell saves and returns to display mode
* Row updates (optimistic update)

### Cancel Inline Edit

#### Workflow
* User double-clicks on cell
* User types new value
* User presses Escape
* Cell returns to display mode
* Original value is preserved

---

## Behavior: Delete Row
Directory: `app/admin/database/[tableName]/behaviors/delete-row/`

Allows deleting records with confirmation.

### Delete Record

#### Preconditions
users:
id, email, name
1, alice@example.com, Alice
2, bob@example.com, Bob

#### Workflow
* User clicks row actions menu on Bob's row
* User clicks "Delete"
* Confirmation dialog appears: "Delete this record?"
* User clicks "Confirm"
* Row is removed from table (optimistic update)
* Success toast appears

#### Postconditions
users:
id, email, name
1, alice@example.com, Alice

### Cancel Delete

#### Workflow
* User clicks "Delete" in row actions
* Confirmation dialog appears
* User clicks "Cancel"
* Dialog closes
* Row remains in table

---

## Behavior: Duplicate Row
Directory: `app/admin/database/[tableName]/behaviors/duplicate-row/`

Creates a copy of an existing record.

### Duplicate Record

#### Preconditions
users:
id, email, name
1, alice@example.com, Alice

#### Workflow
* User clicks row actions menu
* User clicks "Duplicate"
* AddRowDialog opens with values pre-filled from selected row
* ID field is empty (auto-generated)
* User modifies email to "alice2@example.com"
* User clicks "Save"
* New row appears in table

#### Postconditions
users:
id, email, name
1, alice@example.com, Alice
2, alice2@example.com, Alice

# Technical Specification

## Action: fetch-table-data
File: `app/admin/database/[tableName]/behaviors/view-table/fetch-table-data.action.ts`
Input: `{ tableName: string, page?: number, limit?: number, sort?: { column: string, direction: 'asc' | 'desc' }, filter?: string }`
Returns: `Promise<{ rows: Record<string, unknown>[], total: number, page: number, totalPages: number }>`

Fetches paginated, sorted, filtered data from the specified table.

### Primary Use Case

* Validates tableName exists in schema
* Builds dynamic Drizzle query with pagination
* Applies sorting if specified
* Applies text filter across string columns
* Returns rows with pagination metadata

---

## Action: insert-row
File: `app/admin/database/[tableName]/behaviors/add-row/insert-row.action.ts`
Input: `{ tableName: string, data: Record<string, unknown> }`
Returns: `Promise<Record<string, unknown>>`

Inserts a new row into the specified table.

### Primary Use Case

* Validates tableName exists
* Generates Zod schema from table metadata
* Validates data against schema
* Inserts row via Drizzle
* Returns inserted row with generated values (id, timestamps)

---

## Action: update-row
File: `app/admin/database/[tableName]/behaviors/edit-row/update-row.action.ts`
Input: `{ tableName: string, id: string | number, data: Record<string, unknown> }`
Returns: `Promise<Record<string, unknown>>`

Updates an existing row in the specified table.

### Primary Use Case

* Validates tableName and row exists
* Validates data against table schema
* Updates row via Drizzle
* Returns updated row

---

## Action: update-cell
File: `app/admin/database/[tableName]/behaviors/edit-row/update-cell.action.ts`
Input: `{ tableName: string, rowId: string | number, column: string, value: unknown }`
Returns: `Promise<Record<string, unknown>>`

Updates a single cell value.

### Primary Use Case

* Validates column exists and value type matches
* Updates single field via Drizzle
* Returns updated row

---

## Action: delete-row
File: `app/admin/database/[tableName]/behaviors/delete-row/delete-row.action.ts`
Input: `{ tableName: string, id: string | number }`
Returns: `Promise<void>`

Deletes a row from the specified table.

### Primary Use Case

* Validates tableName and row exists
* Deletes row via Drizzle
* Returns void on success

---

## Hook: use-table-data
File: `app/admin/database/[tableName]/behaviors/view-table/use-table-data.ts`
Returns: `{ rows, total, page, totalPages, isLoading, sort, setSort, filter, setFilter, goToPage }`

Manages table data state, pagination, sorting, and filtering.

### Primary Use Case

* Fetches data on mount and when params change
* Manages sort state (column, direction)
* Manages filter state (search term)
* Manages pagination state
* Debounces filter changes

---

## Hook: use-add-row
File: `app/admin/database/[tableName]/behaviors/add-row/use-add-row.ts`
Returns: `{ handleAddRow, isLoading, error }`

Manages adding new rows with optimistic updates.

### Primary Use Case

* Validates form data
* Performs optimistic update to table atom
* Calls insertRow action
* Rolls back on error

---

## Hook: use-edit-row
File: `app/admin/database/[tableName]/behaviors/edit-row/use-edit-row.ts`
Returns: `{ handleEditRow, handleEditCell, isLoading, error }`

Manages row and cell editing with optimistic updates.

### Primary Use Case

* handleEditRow for dialog-based editing
* handleEditCell for inline editing
* Optimistic updates with rollback

---

## Hook: use-delete-row
File: `app/admin/database/[tableName]/behaviors/delete-row/use-delete-row.ts`
Returns: `{ handleDeleteRow, isLoading, error }`

Manages row deletion with optimistic updates.

### Primary Use Case

* Performs optimistic removal from table atom
* Calls deleteRow action
* Rolls back on error

---

## Component: DataTable
File: `app/admin/database/[tableName]/components/data-table.tsx`
Props: `{ tableName: string, columns: ColumnDef[], data: Row[] }`

Main spreadsheet-like table using shadcn data-table (TanStack Table).

### Primary Use Case

* Renders table with dynamic columns
* Handles row selection
* Integrates sorting, filtering, pagination
* Renders CellEditor for inline editing

---

## Component: TableToolbar
File: `app/admin/database/[tableName]/components/table-toolbar.tsx`
Props: `{ onSearch, onAddRow, table }`

Toolbar with search, column visibility, and add button.

### Primary Use Case

* Search input with debounced onChange
* Column visibility dropdown (shadcn DropdownMenu)
* "Add Row" button

---

## Component: ColumnHeader
File: `app/admin/database/[tableName]/components/column-header.tsx`
Props: `{ column, title }`

Sortable column header with sort indicators.

### Primary Use Case

* Displays column name
* Click to cycle sort: asc -> desc -> none
* Shows arrow up/down/none based on state

---

## Component: CellEditor
File: `app/admin/database/[tableName]/components/cell-editor.tsx`
Props: `{ value, type, onSave, onCancel }`

Type-specific cell editor for inline editing.

### Primary Use Case

* text/varchar: Input component
* boolean: Checkbox component
* integer/number: NumberInput component
* timestamp/date: DatePicker component
* json: JSON textarea with validation

---

## Component: RowActions
File: `app/admin/database/[tableName]/components/row-actions.tsx`
Props: `{ row, onEdit, onDuplicate, onDelete }`

Dropdown menu for row actions.

### Primary Use Case

* Renders DropdownMenu with Edit, Duplicate, Delete
* Calls appropriate callback on selection

---

## Component: AddRowDialog
File: `app/admin/database/[tableName]/components/add-row-dialog.tsx`
Props: `{ open, onClose, columns, onSubmit, initialValues? }`

Dialog form for creating/duplicating records.

### Primary Use Case

* Generates form fields from column metadata
* Marks required fields
* Validates on submit
* Supports pre-filled values for duplication

---

## Component: EditRowDialog
File: `app/admin/database/[tableName]/components/edit-row-dialog.tsx`
Props: `{ open, onClose, columns, row, onSubmit }`

Dialog form for editing existing records.

### Primary Use Case

* Pre-fills form with current row values
* ID field is read-only
* Validates on submit

---

## Component: DeleteConfirmation
File: `app/admin/database/[tableName]/components/delete-confirmation.tsx`
Props: `{ open, onClose, onConfirm }`

Confirmation dialog for deletion.

### Primary Use Case

* Shows warning message
* Cancel and Confirm buttons
* Calls onConfirm when confirmed

---

## Component: Pagination
File: `app/admin/database/[tableName]/components/pagination.tsx`
Props: `{ page, totalPages, onPageChange }`

Page navigation controls.

### Primary Use Case

* Shows current page / total pages
* Previous/Next buttons
* First/Last page buttons

# Tasks

* [ ] Implement fetch-table-data action with pagination, sorting, filtering
* [ ] Implement insert-row action with dynamic validation
* [ ] Implement update-row action
* [ ] Implement update-cell action
* [ ] Implement delete-row action
* [ ] Create use-table-data hook
* [ ] Create use-add-row hook
* [ ] Create use-edit-row hook
* [ ] Create use-delete-row hook
* [ ] Build DataTable component with shadcn data-table
* [ ] Build TableToolbar component
* [ ] Build ColumnHeader component
* [ ] Build CellEditor component with type-specific editors
* [ ] Build RowActions component
* [ ] Build AddRowDialog component
* [ ] Build EditRowDialog component
* [ ] Build DeleteConfirmation component
* [ ] Build Pagination component
* [ ] Create page at app/admin/database/[tableName]/page.tsx
* [ ] Create state.ts with table data atoms
* [ ] Add tests for all actions
* [ ] Add tests for hooks

# Notes

- Uses schema introspection utility from WEB-16
- Dynamic Zod schema generation from Drizzle column metadata is key for validation
- Consider performance for tables with many rows - may need virtual scrolling later
- Inline editing should respect column constraints (not null, unique, etc.)
- Primary key columns should be read-only in edit forms
