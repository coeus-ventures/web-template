# [Issue title]

Brief overview of what this issue accomplishes.

# Functional Specification

## Behavior: [Name]
Directory: `[page-directory]/behaviors/[behavior-name]/`

[Brief description of what this behavior allows users to do and its purpose]

* User is [authentication state]
* Database has [initial state]
* Application is in [mode/state]

### [Primary Use Case]

#### Preconditions
users:
id, email, role, status
1, user@example.com, client, active

projects:
id, user_id, name, status
1, 1, Test Project, active

#### Workflow
* User is logged in as "client"
* Navigate to "[page/feature]"
* [Perform primary action]
* [Verify expected result appears]
* Database contains [expected records]

#### Postconditions
users:
id, email, role, status
1, user@example.com, client, active

projects:
id, user_id, name, status
1, 1, Test Project, active
2, 1, New Project, active

audit_logs:
id, user_id, action, resource_id
1, 1, create_project, 2


### [Edge Case or Alternative Flow]


#### Workflow
* User with suspended account attempts login
* System blocks access
* Error message "Account suspended" appears
* Login attempt is logged


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

