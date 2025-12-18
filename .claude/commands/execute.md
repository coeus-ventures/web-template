---
description: Execute an issue following Behave.js architecture
argument-hint: @docs/issues/[issue-file].md
---

# Execute

Instructions: $ARGUMENTS

This command guides you through executing a complete issue following the Behave.js architecture patterns. Each step utilizes specialized agents that are experts in their domain. Follow each step in order, using the appropriate agent for each part of the implementation.

This build process leverages specialized agents for each layer of the architecture:

| Agent | Purpose | Layer |
|-------|---------|-------|
| **integration-writer** | Implements external integrations and complex business logic | Backend |
| **action-writer** | Creates server actions with auth, validation, and direct Drizzle queries | Backend |
| **hook-writer** | Implements client hooks with state management and optimistic updates | Frontend |
| **component-writer** | Creates UI components that consume hooks | Frontend |
| **test-writer** | Writes all types of tests: behavior (.spec.ts), action (.action.test.ts), and hook (.test.tsx) | Testing |
| **route-writer** | Creates API routes and server-side route handlers | Backend |

Each agent is an expert in their domain and follows the project's three-layer architecture patterns. They ensure consistency, include proper debug logging, and handle errors appropriately.

**Prerequisites**: If the page.tsx the behavior belongs to doesn't exist yet, create an empty page with the 'use client' directive.

# Steps to Execute the Issue

Here is the order of steps to execute the issue: 

1. Create or Update Integrations (if necessary)
2. Create or Update State (Jotai Atoms)
3. Create or Update Actions
4. Create or Update Hooks
5. Create or Update Components
6. Create End-to-End Behavior Test

Details for each step are provided below.


## 1. Create or Update Integrations (if necessary)

**Location:** `/shared/integrations/[integration-name]/`

### When to Create/Update:
- External API integrations needed
- Complex business logic that doesn't belong in actions
- Email, notifications, or third-party services
- Heavy computations or background tasks

### Agent Instructions:
**Use the integration-writer agent**

**Required Information:**
- Integration purpose (email, payment, analytics, etc.)
- External APIs or libraries to integrate
- Complex business logic requirements
- Environment variables needed

The integration-writer agent will handle all implementation details following the project's Backend layer patterns.

## 2. Create or Update State (Jotai Atoms)

**Location:** `app/(app)/[page]/state.ts`

### When to Create/Update:
- New page needs state management
- New entities to track (e.g., list of items, loading states)
- New UI state (e.g., modal open/closed, form states)

### Manual Implementation:
State files are typically created manually as they require domain-specific knowledge. Create the state.ts file in the page directory (same level as page.tsx).

### Common Atom Patterns:
- **Data atoms**: Store your entities (arrays or objects)
- **Loading atoms**: Track async operation states
- **UI atoms**: Modal/dialog visibility, form states
- **Selection atoms**: Track selected items
- **Filter/Search atoms**: Store filter criteria
- **Derived atoms**: Computed state based on other atoms

## 3. Create or Update Actions

**Location:** `app/(app)/[page]/behaviors/[behavior-name]/actions/[action-name].action.ts`

### Agent Instructions:
**Use the action-writer agent**

**Required Information:**
- Behavior name and action purpose
- Input data requirements and validation rules
- Which database tables to query (from `db/schema.ts`)
- Authentication requirements
- Expected return data structure

The action-writer agent will handle all implementation details following the project's Backend layer patterns, using direct Drizzle queries.

### Testing the Action:
After creating the action, **use the test-writer agent** to create an action test:

**Test Location:** `app/(app)/[page]/behaviors/[behavior-name]/tests/[action-name].action.test.ts`

The test-writer will create a single test case using:
- PreDB/PostDB patterns for database state verification
- Mocked authentication with `createTestUser`
- Real database operations (NODE_ENV=test)

**Run the test:**
```bash
bun run test [action-name].action.test.ts
```

## 4. Create or Update Hooks

**Location:** `app/(app)/[page]/behaviors/[behavior-name]/hooks/use-[behavior].ts`

### Agent Instructions:
**Use the hook-writer agent**

**Required Information:**
- Behavior name and purpose
- Which Jotai atoms from state.ts to use
- Server action to call
- Validation requirements
- Optimistic update strategy
- Error handling needs

The hook-writer agent will handle all implementation details following the project's Frontend layer patterns.

### Testing the Hook:
After creating the hook, **use the test-writer agent** to create a hook test:

**Test Location:** `app/(app)/[page]/behaviors/[behavior-name]/tests/use-[behavior].test.tsx`

The test-writer will create a single test case using:
- Mocked server actions
- HydrateAtoms pattern for Jotai state
- Testing Library's renderHook
- Verification of state updates and optimistic updates

**Run the test:**
```bash
bun run test use-[behavior].test.tsx
```

## 5. Create or Update Components

**Location:** `app/(app)/[page]/components/[ComponentName].tsx`

### Agent Instructions:
**Use the component-writer agent**

**Required Information:**
- Component purpose and UI requirements
- Which behavior hooks to consume
- Props interface requirements
- Loading and error state displays
- Form handling needs (if applicable)
- Tailwind styling requirements

The component-writer agent will handle all implementation details following the project's Frontend layer patterns.

## 6. Create End-to-End Behavior Test

After implementing all the components, create a comprehensive end-to-end test to verify the complete user workflow.

**Location:** `app/(app)/[page]/behaviors/[behavior-name]/tests/[behavior-name].spec.ts`

### Agent Instructions:
**Use the test-writer agent** to create a behavior test

**Required Information:**
- Behavior name and expected workflow
- Page route and authentication requirements
- Success scenario to test
- Data-testid attributes used in components

The test-writer will create a single Playwright test that:
- Navigates to the page
- Performs user interactions
- Verifies expected outcomes
- Cleans up test data after completion

### Running the Behavior Test:

```bash
bun run spec [behavior-name].spec.ts
```

**Check the logs after test completes:**
```bash
tail -n 100 logs/test.log
```
This shows the last 100 lines of logs to see what happened during the test.

### Analyze results and logs:
- **If test passes**: ✅ Complete behavior is working correctly
- **If test fails**:
  - Check the Playwright output for specific failures
  - Review `logs/test.log` for server-side errors
  - Check browser console errors in Playwright output
  - Look for authentication, validation, or database issues

### Debug common issues:
- Missing `data-testid` attributes on components
- Authentication not working (check `.auth/user.json` exists)
- Server actions throwing errors (check logs)
- Components not rendering expected content
- Timing issues (may need to adjust timeouts)

### Fix issues and re-run:
1. Fix the identified issues
2. Re-run the behavior test:
   ```bash
   bun run spec [behavior-name].spec.ts
   ```
3. Check logs again if needed:
   ```bash
   tail -n 100 logs/test.log
   ```
4. Repeat until the behavior test passes

### Test Best Practices:

**For All Tests:**
1. **Start Small**: Write one test case first, expand later
2. **Test Behavior**: Focus on outcomes, not implementation
3. **Isolate Tests**: Each test should be independent
4. **Clean Up**: Remove test data after tests

**For Behavior Tests:**
1. **Base URL**: Always use `const baseUrl = 'http://localhost:8080';`
2. **Authentication**: Use `test.use({ storageState: '.auth/user.json' });` for auth-required pages
3. **Data Test IDs**: Ensure all interactive elements have `data-testid` attributes
4. **Real Workflows**: Test actual user behavior, not just happy paths

**For Action Tests:**
1. **Use PreDB/PostDB**: Set up and verify database state
2. **Mock Minimally**: Only mock auth and external services
3. **Test with Real DB**: Use NODE_ENV=test database

**For Hook Tests:**
1. **Mock Actions**: Mock server actions, not Jotai state
2. **Use HydrateAtoms**: Initialize state properly
3. **Test State Changes**: Verify optimistic updates and rollbacks

### Monitoring and Debugging:
- **Run tests first**, then check logs with `tail logs/test.log` after completion
- **Review logs** at `logs/test.log` for server-side issues and debug output
- **Use Playwright's** `--debug` flag for step-by-step debugging
- **Check browser console** for client-side JavaScript errors
- **Verify database state** if data operations aren't working

### Debug Logging Features:

The build command includes comprehensive debug logging for all layers:

**🔧 SERVER ACTION** logs show:
- Function calls with parameters (JSON formatted)
- Authentication status and user ID
- Validation results
- Database queries and results
- Success/error responses

**🔧 INTEGRATION** logs show:
- Integration method calls with parameters
- External API requests and responses
- Success/error states

**🔧 HOOK HANDLER** logs show:
- Hook function calls with parameters
- Validation results
- Loading state changes
- Optimistic updates (add/rollback)
- Server action calls and responses

**Usage during testing:**
1. Run your Playwright test:
   ```bash
   bun run spec behavior.spec.ts
   ```
2. After test completes, check the logs:
   ```bash
   tail -n 100 logs/test.log
   ```
3. Review logs to see exactly what functions were called and with what parameters
4. Debug issues by following the complete flow from UI → Hook → Action → Database
5. The logs show the exact sequence of calls with all parameters for easy debugging

This behavior test step ensures your complete behavior works from UI to database and back, catching integration issues that unit tests might miss.

## File Organization Pattern

```
app/(app)/[page]/
├── page.tsx                 # Next.js page component
├── state.ts                 # Jotai atoms for page state
├── components/              # UI components
│   ├── [List].tsx
│   ├── [Card].tsx
│   └── [Form].tsx
└── behaviors/               # Grouped by user action
    └── [behavior-name]/     # e.g., "add-bookmark", "view-bookmarks"
        ├── actions/         # Server actions
        │   └── [action].action.ts
        ├── hooks/           # Client hooks
        │   └── use-[behavior].ts
        └── tests/           # All tests for this behavior
            ├── [action].action.test.ts
            ├── use-[behavior].test.tsx
            └── [behavior].spec.ts
```

## Testing Summary

Tests are created alongside each implementation step using the test-writer agent:

1. **After creating actions** → Write action tests (.action.test.ts)
2. **After creating hooks** → Write hook tests (.test.tsx)
3. **After full implementation** → Write behavior tests (.spec.ts)

Each test starts with a single test case following the "start small" principle.

## Common Patterns to Follow

1. **Error Handling**: Always return `{ success, data?, error? }` format
2. **Authentication**: Check `getUser()` in all protected actions
3. **Validation**: Use Zod schemas for input validation
4. **Optimistic Updates**: Update UI immediately, rollback on failure
5. **Loading States**: Show visual feedback during async operations
6. **Test IDs**: Add `data-testid` attributes for testing
7. **TypeScript**: Use proper types for all data structures
8. **File Naming**: Follow consistent naming conventions