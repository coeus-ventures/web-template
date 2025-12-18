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

##### PreDB
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

##### PostDB
[table-name]:
col_a, col_b, col_c
1, foo, bar
2, new, row

#### [Edge Case or Alternative Flow]

##### PreDB
[Optional CSV tables as needed]

##### Steps
* Act: [Trigger the edge case]
* Check: Error "[expected message]" is shown
* Check: No new records are created

# Technical Specification

## Action: [actionName](input: InputType): Promise<ResultType>

File: `[behavior-path]/[action-name].action.ts`

[Single sentence describing what this action does and when it's called]

- Given: [input parameters and assumptions]
- Returns: [value or outcome returned]
- Calls: [direct dependencies - Models, Integrations]

### Example: [Primary Use Case]

#### PreDB
[table_name]:
column1, column2, column3
value1, value2, value3

#### Steps
* Call: [actionName]({ field1: "value", field2: 123 }) as user 1
* Returns: { id: 1, field1: "value", status: "created" }

#### PostDB
[table_name]:
column1, column2, column3, column4
value1, value2, value3, newval

### Example: [Error Case]

#### PreDB
[table_name]:
column1, column2
value1, value2

#### Steps
* Call: [actionName]({ field1: "invalid" }) as user 1
* Throws: "[Expected error message]"

#### PostDB
[table_name]:
column1, column2
value1, value2

---

## Hook: use[BehaviorName]()

File: `[behavior-path]/use-[behavior-name].ts`

Entry point for the [Behavior Name] behavior. [What it validates, updates, and calls.]

### State
- isLoading: boolean
- error: string | null

### Returns
- handle[BehaviorName]: (input: Type) => Promise<void> - triggers the behavior
- isLoading: boolean - submission in progress
- error: string | null - current error message

### Dependencies
- useSetAtom([atomName]) - for optimistic updates

### Example: [Primary Use Case]

#### PreState
[atomName]: []
isLoading: false
error: null

#### Steps
* Call: handle[BehaviorName]({ field: "value" })
* Returns: void

#### PostState
[atomName]: [{ id: 1, field: "value", pending: false }]
isLoading: false
error: null

### Example: [Validation Error]

#### PreState
[atomName]: []
isLoading: false
error: null

#### Steps
* Call: handle[BehaviorName]({ field: "" })
* Throws: "[Validation error message]"

#### PostState
[atomName]: []
isLoading: false
error: "[Validation error message]"

---

## Component: [ComponentName]

File: `[page-path]/components/[component-name].tsx`

[Single sentence describing what this component renders and its purpose]

### Props
- [propName]: [Type] - [description]
- [propName]?: [Type] - [optional prop description]

### State

#### Local
- [stateName]: [Type] - [description]

#### Shared
- [atomName]: [Type] - [description of shared state]

### Children
- [ChildComponent] - [purpose]
- [ChildComponent] - [purpose]

---

## Integration: [IntegrationName]

File: `shared/integrations/[integration-name]/index.ts`

[Single sentence describing what external system this integrates with and why]

### Methods

#### [methodName](input: Type): Promise<ResultType>
- Given: [input parameters]
- Returns: [expected result]
- Throws: [error conditions]

### Example: [Primary Use Case]

#### Steps
* Call: [IntegrationName].[methodName]({ param: "value" })
* Returns: { result: "data" }

### Example: [Error Case]

#### Steps
* Call: [IntegrationName].[methodName]({ param: "invalid" })
* Throws: "[Expected error]"

# Tasks

Implementation tasks for this feature

* [ ] Backend implementation
* [ ] Frontend components
* [ ] Testing
* [ ] Documentation

# Notes

Additional implementation considerations and decisions
