# [Issue title]

Brief overview of what this issue accomplishes.

# Functional Specification

## Behavior: [Name]

[One paragraph describing the behavior in user-facing terms.]
Directory: `app/[role]/[page]/behaviors/[behavior-name]/`

### Rules

#### [Rule Name]
- When:
  - [Condition]
  - [Condition]
- Then:
  - [Outcome]
  - [Outcome]

#### [Rule Name]
- When:
  - [Condition]
- Then:
  - [Outcome]

### Examples

#### [Primary Use Case]

##### Preconditions
[table-name]:
col_a, col_b, col_c
1, foo, bar

[table-name]:
col_a, col_b
1, baz

##### Steps
* Act: [User or system performs an action that changes state]
* Act: [Another action]
* Check: [Observable result in UI / API response]
* Check: [Observable result in database / derived state]

##### Postconditions
[table-name]:
col_a, col_b, col_c
1, foo, bar
2, new, row

#### [Edge Case or Alternative Flow]

##### Preconditions
[Optional CSV tables as needed]

##### Steps
* Act: [Trigger the edge case]
* Check: Error "[expected message]" is shown
* Check: No new records are created

# Technical Specification

## Action: [Action Name]
File: `[behavior-path]/actions/[action-name].action.ts`
Input: `{ field1: string, field2: number, field3?: boolean }`
Returns: `Promise<Result<Type, Error>>`

[Single sentence describing what this action does and when it's called]

### Preconditions
[table_name]:
column1, column2, column3
value1, value2, value3

### [Primary Use Case]

* Validates field1 is between 3-100 characters
* Validates field2 is positive integer
* Checks user permissions for [resource]
* Validates [business rule]
* Transforms data by [transformation]
* Calls Model.[method] to persist
* Triggers [side effect] if successful

### Postconditions
[table_name]:
column1, column2, column3, column4
value1, value2, value3, newval

---

## Hook: use-[behavior-name]
File: `[behavior-path]/use-[behavior-name].ts`
Returns: `{ mutate, isPending, error }`

[Single sentence describing what this hook manages and its UI interaction]

### [Primary Use Case]

* Reads from `[atomName]` atom
* Validates input before calling action
* Shows inline errors for [fields]
* Prevents submission if invalid
* Updates `[atomName]` optimistically
* Rolls back on error

### [Error Recovery]

* Displays toast notification on error
* Reverts optimistic update
* Preserves form data for retry

---

## Component: [ComponentName]
File: `[page-path]/components/[component-name].tsx`
Props: `{ prop1: Type, prop2?: Type }`

[Single sentence describing what this component renders and its purpose]

### [Primary Use Case]

* [Specific UI elements it renders]
* Uses `use-[hook-name]` for [behavior]
* Renders [UI elements]
* Handles [user interactions]

---

## Service: [ServiceName]
File: `services/[service-name].ts`

[Single sentence describing what external system this integrates with and why]

### [Primary Use Case]

* Integrates with [external API/service]
* Handles [authentication/rate limiting/retries]
* Transforms external data to internal format
* Returns typed responses
* Throws specific errors for different failure cases

### [Error Handling]

* Retries on network failures (max 3 attempts)
* Throws typed errors for API failures
* Logs errors for monitoring

# Tasks

Implementation tasks for this feature

* [ ] Backend implementation
* [ ] Frontend components
* [ ] Testing
* [ ] Documentation

# Notes

Additional implementation considerations and decisions
