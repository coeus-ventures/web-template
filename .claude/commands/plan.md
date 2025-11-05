---
description: Update issue file with detailed implementation plan
argument-hint: @docs/issues/[issue-file].md
---

# Plan

Instructions: $ARGUMENTS

- Update the issue file in the instructions by following the @docs/templates/behavior-issue.md format if this is a behavior related issue or the @docs/templates/page-issue.md 

- Issues tend to follow this naming convention:
  - Implement [name of the behavior]
  - Change [name of the behavior] to X
  - Fix [name of the bug] in [name of the behavior]
  - Change design of [name of the component/page] to X
  - Implement design of [name of the component/page] 

1. Navigate to the page folder if it already exist to understand what is already implemented before writring the plan. Also look at the current schema.ts if necessary. Don't change anything, you are only exploring in this phase.
2. Update the issue plan file with a a plan following the issue template. Only Update the issue file, don't start implementing yet. Instructions for your plan:
   - If the behavior or component already exist focus on what needs to change.
   - Make only the most important test cases. The test cases should take inspiration from the Examples provided in the Functional Specification when applicable, even on the unit tests. 


