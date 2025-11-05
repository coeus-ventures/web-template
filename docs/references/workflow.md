# Workflow


## Manual

1. Use the /spec command with the description of the product to generate an SPEC.md file
2. Use the /break command passing the @SPEC.md file. It will generate issue files in docs/issues
3. Use the /run command passing the issue file to implement the issue.

**Example**

/spec create a personal CRM
/break @SPEC.md
/run @docs/issues/01-implement-home-page.md


## Automatic

1. Use the /spec command with the description of the product to generate an SPEC.md file
2. Use the /break command passing the @SPEC.md file. It will generate issue files in docs/issues
3. Use the /build command. It will run each issue in docs/issues one by one

**Example**

/spec create a personal CRM
/break @SPEC.md
/build