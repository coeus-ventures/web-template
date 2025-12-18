---
description: Document a behavior by analyzing its implementation
argument-hint: path/to/behavior/directory
---

# Document

Instructions: $ARGUMENTS (path to behavior directory)

Analyze the behavior directory specified and create a comprehensive [behavior-name].md file at the root of the behavior folder documenting the user behavior and its implementation.

## Process:

1. **Start with hook analysis** to understand the behavior:
   - Find the primary hook file (`use-*.ts`) in the behavior directory
   - Trace where this hook is used in components to understand user activation
   - Identify the UI elements (buttons, forms, cards) that trigger the behavior
   - Document the complete user interaction flow

2. **Map the technical implementation**:
   - Follow the hook to identify server actions called
   - Examine action files (`.action.ts`) for business logic
   - Check models and services used for data persistence
   - Understand state management and optimistic updates

3. **Create behavior documentation** following this structure:

```markdown
# [Behavior Name]
Path: [behavior-directory-path]

[Brief description of what the user accomplishes with this behavior]

## [Primary Use Case Scenario Name]

### PreDB
[Database table state before behavior execution]
table_name:
column1, column2, column3
value1, value2, value3

### Workflow
* [Step-by-step user interactions in past tense]
* [Include UI elements: buttons, forms, dialogs, etc.]
* [Document navigation and page transitions]
* [Note any loading states or confirmations]

### PostDB
[Database table state after behavior execution]
table_name:
column1, column2, column3
updated_value1, updated_value2, updated_value3

## [Additional Scenarios if applicable]
[Error cases, edge cases, etc.]
```

4. **Key requirements**:
   - File must be named exactly `[behavior-name].md` (matching the directory name)
   - Place it at the root of the behavior folder
   - Focus on USER BEHAVIOR, not technical implementation details
   - Use clear step-by-step workflow with `*` bullets
   - Include actual database state changes (PreDB/PostDB)
   - Document multiple scenarios when applicable (success, error, edge cases)
   - Use past tense for user actions ("User clicked", "Dialog appeared")

5. **Analysis approach**:
   - **Start with hooks**: Find `use-*.ts` files to understand the behavior entry points
   - **Trace component usage**: Search for hook imports to find UI triggers
   - **Follow action calls**: Identify what server actions are invoked
   - **Document user journey**: Map the complete user experience from trigger to completion
   - **Identify state changes**: Document database and UI state before/after

6. **Focus on user experience**:
   - How does the user initiate this behavior?
   - What UI elements do they interact with?
   - What feedback do they receive?
   - How does the system respond?
   - What changes as a result?

