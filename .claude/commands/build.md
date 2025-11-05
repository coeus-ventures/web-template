---
description: Build all issues in sequence from docs/issues/
---

# Build

Process and implement all issues in the `docs/issues/` directory sequentially, tracking progress in `docs/issues/status.md`.

## Workflow

1. **Discover Issues**
   - Use Glob to find all issue files in `docs/issues/` (exclude `status.md`)
   - Sort issues by filename (numeric prefix) to ensure correct order
   - Read the first issue to understand the work scope

2. **Create Status File**
   - Create or overwrite `docs/issues/status.md` file
   - Use markdown format with this structure:
     ```markdown
     # Project Execution Status

     Last Updated: [timestamp]

     ## Issues

     - [ ] 001-issue-name.md - pending
     - [ ] 002-issue-name.md - pending
     - [ ] 003-issue-name.md - pending

     ## Summary

     Total: X issues
     Completed: 0
     In Progress: 0
     Pending: X
     Failed: 0

     ## Execution Log

     [Entries will be added as issues are processed]

     ## Notes

     [Add any important notes, blockers, or decisions here]
     ```

3. **Execute Issues Sequentially**
   - For each issue in the status file:
     a. Update the issue line to `- [ ] [filename] - in_progress`
     b. Add entry to Execution Log: `### [filename] - Started at [timestamp]`
     c. Execute `/run @docs/issues/[filename]` to complete the issue
     d. Wait for the /run command to fully complete before continuing
     e. If successful:
        - Update issue line to `- [x] [filename] - completed`
        - Add to log: `Result: ✅ Success`
        - Add any relevant notes to Notes section
        - Update Summary counters
     f. If failed:
        - Keep as `- [ ] [filename] - failed`
        - Add to log: `Result: ❌ Failed - [error details]`
        - Add failure details to Notes section
        - Report error and ask user: retry, skip, or stop
     g. Move to the next issue

4. **Handle Errors**
   - If an issue fails during /run:
     - Mark the issue as `failed` in docs/issues/status.md
     - Log the error details in the Execution Log
     - Add troubleshooting notes to Notes section
     - Ask the user whether to:
       - **Retry**: Re-run the same issue
       - **Skip**: Mark as failed and continue to next issue
       - **Stop**: Halt execution and provide summary
   - Never mark an issue as `completed` if it failed

5. **Maintain Status File**
   - Update `docs/issues/status.md` after every state change
   - Keep Summary section accurate
   - Add timestamps to Execution Log entries
   - Add relevant notes for important decisions or blockers
   - Preserve the file for project tracking and resumability

6. **Completion Summary**
   - After all issues are processed, update docs/issues/status.md with final summary
   - Provide user with:
     - Total issues processed
     - Successfully completed issues
     - Failed issues (if any)
     - Link to `docs/issues/status.md` for full execution history

## Status File Format

```markdown
# Project Execution Status

Last Updated: 2025-01-15 10:45:30

## Issues

- [x] 001-implement-contacts-page.md - completed
- [ ] 002-implement-add-contact.md - in_progress
- [ ] 003-implement-view-contact.md - pending
- [ ] 004-implement-search-contacts.md - pending

## Summary

Total: 4 issues
Completed: 1
In Progress: 1
Pending: 2
Failed: 0

## Execution Log

### 001-implement-contacts-page.md
Started: 10:30:15
Result: ✅ Success
Completed: 10:45:22

### 002-implement-add-contact.md
Started: 10:45:30
Status: In progress...

## Notes

- Successfully implemented contacts page with all components
- Add contact feature requires new database schema updates
```

## Important Notes

- **Sequential Processing**: Complete one issue fully before starting the next
- **No Parallel Execution**: Issues may have dependencies on previous issues
- **Respect /run Workflow**: Each issue goes through plan → build phases
- **State Tracking**: docs/issues/status.md tracks project execution status
- **Project Visibility**: status.md shows overall progress and execution history
- **Resumability**: If execution stops, status.md shows what's completed and what's pending
- **Notes Section**: Use Notes to document important decisions, blockers, or context

## Example Usage

```
/execute
```

This command requires no arguments and will automatically:
1. Discover all issues in `docs/issues/`
2. Create `docs/issues/status.md` tracking file
3. Process each issue sequentially
4. Update status.md with progress, results, and notes 