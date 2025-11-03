# [Behavior Name]
Path:

[Brief description of what this behavior tests and its business value]

Usage Notes:
- Include any combination of module types below (Model, Action, Hook, Component, Service)
- You can have multiple of any module type (e.g., multiple Actions, multiple Components)
- Only include modules that are part of this behavior's implementation
- Each module represents the current state/implementation, not planned changes
- Preconditions and Postconditions are used only for side effects like database state, files being changed, etc.

## [Primary Use Case]

### Preconditions
[table_name]:
column1, column2, column3
value1, value2, value3

### Workflow
* User must be logged in as "[role]"
* Open the "[page/feature]"
* [Perform specific action with "data"]
* "[Expected result]" appears on screen
* Verify database updated correctly

### Postconditions
[table_name]:
column1, column2, column3, column4
value1, value2, value3, newval

## [Alternative Flow]

### Preconditions
[table_name]:
column1, column2
value1, value2

### Workflow
* User with "[specific-condition]" logs in
* Navigate to "[restricted-feature]"
* System redirects to "[alternative-page]"
* Message "[feedback]" is displayed
* Verify fallback behavior executed

### Postconditions
[table_name]:
column1, column2, updated_at
value1, value2, [timestamp]

## [Error Handling]
Tags: error

### Preconditions
[table_name]:
id, status, retry_count
1, active, 0

### Workflow
* Create "[error-condition]" in system
* User attempts "[action]"
* Error message "[error-message]" appears
* Verify operation was rolled back
* Check error logged in database

### Postconditions
[table_name]:
id, status, retry_count
1, active, 1
error_logs:
id, error_type, message
1, [type], [msg]

## [Data Validation]

### Preconditions
form_state:
field, value, error
email, ,
password, ,
username, ,

Test with multiple inputs:

| Input Field | Value    | Expected Error        |
|-------------|----------|-----------------------|
| email       | invalid  | Invalid email format  |
| password    | 123      | Too short             |
| username    |          | Required field        |

### Workflow
* Fill form field <Input Field> with "<Value>"
* Tab to next field to trigger validation
* Error message "<Expected Error>" appears inline
* Submit button remains disabled
* Verify no API call was made

### Postconditions
form_state:
field, value, error
email, invalid, Invalid email format
password, 123, Too short
username, , Required field
validation_logs:
field, attempt_value, error_type
email, invalid, FORMAT_ERROR
password, 123, LENGTH_ERROR
username, , REQUIRED_FIELD

---

# Implementation Modules

## Model: [ModelName]
File: `models/[model-name].ts`

[Single sentence describing what this model manages and its purpose]

### [Primary Operations]

#### create(data)
* Validates input data against schema
* Creates new record in database
* Returns created record with generated ID

#### findById(id)
* Queries database for record with given ID
* Returns record or null if not found

#### update(id, data)
* Validates update data
* Updates record if exists
* Returns updated record

---

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

### [Primary Flow]

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

[Single sentence describing what this component renders and its purpose]

### [Primary use case]

* Renders [specific UI elements]
* Uses `use-[hook-name]` for [behavior]
* Handles [user interactions]
* Shows loading state during operations


---

## Service: [ServiceName]
File: `services/[service-name].ts`

[Single sentence describing what external system this integrates with and why]

### [Primary use case]

* Connects to [external API/service]
* Handles authentication via [method]
* Implements rate limiting
* Transforms external data to internal format
* Returns typed responses