# Epic Specification Format

This document defines a **behavior-centric specification system** for describing software. Specifications are organized into two categories:

**Functional Specifications** describe *what the system does* from the user's perspective. They form a hierarchy:

```
Project → Flow → Page → Behavior
```

**Technical Specifications** describe *how the system is built* from the developer's perspective. They are a flat catalog of implementation units:

```
Function | Class | Component | Hook
```

**Behavior is the bridge between both.** It is the leaf of the Functional hierarchy and the unit that Technical specs reference. All specifications are written in concise, human-readable Markdown.

---

# Part 1: Functional Specifications

Functional specifications describe user journeys, screens, and observable actions. A product manager or designer could write and read these without knowing the codebase.

---

## 1. Project Specification Format

Project specifications describe **the entire application** as a composition of pages and flows, each with their associated behaviors. They provide a high-level map of the system.

### Purpose

Project specifications answer:
- What pages exist in the application?
- What flows guide users through the application?
- Which behaviors are available on each page?
- Which behaviors comprise each flow?

### Structure

A project specification consists of:
1. A heading naming the **project**
2. A short description of the application
3. A **Pages** section listing all pages with their behaviors
4. A **Flows** section listing all flows with their behaviors

### Conventions

- Each page entry includes the path and a list of behaviors
- Each flow entry includes a description and an ordered list of behaviors
- Behaviors are listed by name, linking pages and flows to the behavior specifications

### Example

```markdown
# Project Management App

A web application for creating and managing projects with team collaboration.

## Pages

### Projects Page
**Path:** `/projects`

#### Behaviors
- List Projects
- Create Project
- Delete Project

### Project Details Page
**Path:** `/projects/:id`

#### Behaviors
- View Project
- Edit Project
- Add Team Member
- Remove Team Member

### Settings Page
**Path:** `/settings`

#### Behaviors
- Update Profile
- Change Password
- Manage Notifications

## Flows

### User Onboarding
Guides a new user from account creation to their first project.

#### Behaviors
1. User Registration
2. User Authentication
3. Create Project
4. View Project

### Team Collaboration
Allows a project owner to invite and manage team members.

#### Behaviors
1. View Project
2. Add Team Member
3. Assign Task
4. Remove Team Member

### Project Lifecycle
Covers the full lifecycle of a project from creation to completion.

#### Behaviors
1. Create Project
2. Edit Project
3. Add Team Member
4. Complete Project
5. Archive Project
```

---

## 2. Flow Specification Format

Flow specifications describe **user journeys** as ordered collections of behaviors across pages. A flow represents how a user moves through the system over time. It does not introduce new behavior or UI; it only references existing behaviors and the pages where they occur.

### Purpose

Flow specifications answer:
- How does a user accomplish a goal end-to-end?
- In what order are behaviors experienced?
- On which pages do those behaviors occur?

### Structure

A flow specification consists of:
1. A heading naming the **flow**
2. A short description of the journey and its goal
3. An ordered list of **steps**

Each step references:
- a **behavior**
- the **page path** where it occurs
- a brief description of user intent

### Example

```markdown
# User Onboarding

Guides a new user from account creation to their first successful project.

## Behaviors

1. **User Registration** — `/signup`
   User creates a new account.

2. **User Authentication** — `/login`
   User logs into the application.

3. **Create Project** — `/projects`
   User creates their first project.

4. **View Project Dashboard** — `/projects/:id`
   User sees the project overview and next actions.
```

---

## 3. Page Specification Format

Page specifications describe **application pages (routes)** as compositions of components and behaviors. They sit above components and below flows, making routing and UI composition explicit.

### Purpose

Page specifications answer:
- What is this page responsible for?
- Which components are rendered on this page?
- Which behaviors are exposed through this page?

### Structure

A page specification consists of:
1. A heading naming the **page**
2. The route **path**
3. A short **overview**
4. A list of **components** rendered on the page
5. A list of **behaviors** available from the page

### Example

```markdown
# Projects Page

**Path:** `/projects`

## Overview

Displays the user's projects and allows creating and managing them.

## Components

### ProjectList

Displays the list of projects for the current user.

### CreateProjectForm

Allows the user to create a new project.

## Behaviors

### Create Project

Allows the user to create a new project from the projects page.

### Delete Project

Allows the user to remove an existing project.
```

---

## 4. Behavior Specification Format

Behavior specifications describe **end-to-end observable behavior** governed by declarative rules. Behavior is the leaf of the Functional hierarchy and the primary unit that Technical specs reference.

### Structure

A behavior specification consists of:
1. A top-level heading naming the **behavior**
2. A one-paragraph description
3. The behavior directory
4. A **Rules** section - named rules with When/Then conditions
5. An **Examples** section - concrete scenarios demonstrating the behavior

Each example may include:
- **PreDB** (optional) - system state before the behavior
- **Steps** (required) - actions and verifications
- **PostDB** (optional) - system state after the behavior

### Step Keywords

Steps use prefixes to distinguish actions from verifications:
- **Act:** - user or system performs an action (changes state)
- **Check:** - verification that something is true (asserts state)

### Example

```markdown
# Create Project

Allows authenticated users to create a new project.
Directory: `pages/projects/behaviors/create-project/`

## Rules

### Authentication Required
- When:
  - User is not authenticated
- Then:
  - Reject with "Unauthorized"

### Unique Name Per User
- When:
  - Project name already exists for user
- Then:
  - Reject with "Project name already exists"
  - Form field "name" shows error

### Name Required
- When:
  - Project name is empty
- Then:
  - Reject with "Name is required"
  - Form field "name" shows error

### Name Too Long
- When:
  - Project name exceeds 100 characters
- Then:
  - Reject with "Name must be 100 characters or less"
  - Form field "name" shows error

### Default Status
- When:
  - Project is created successfully
- Then:
  - Status defaults to "draft"
  - Created timestamp is set

## Examples

### User creates a new project successfully

#### PreDB
users:
id, email, role, status
1, user@example.com, client, active

projects:
id, user_id, name, status
1, 1, Test Project, active

#### Steps
* Act: User logs in as "client"
* Act: User navigates to the projects page
* Act: User submits the create project form with name "New Project"
* Check: New project appears in the list
* Check: Project status is "draft"

#### PostDB
projects:
id, user_id, name, status
1, 1, Test Project, active
2, 1, New Project, draft

### User tries to create project with duplicate name

#### PreDB
users:
id, email, role, status
1, user@example.com, client, active

projects:
id, user_id, name, status
1, 1, Existing Project, active

#### Steps
* Act: User logs in as "client"
* Act: User navigates to the projects page
* Act: User submits the create project form with name "Existing Project"
* Check: Error "Project name already exists" is shown
* Check: No new project is created
```

**Rules** are named declarative constraints with When/Then conditions. Each rule has a descriptive name, a list of conditions (When), and a list of outcomes (Then). Multiple conditions are implicitly AND. For OR logic, create separate rules. **Examples** demonstrate how the behavior plays out in concrete scenarios. Steps focus on **observable behavior**, not implementation details.

---

# Part 2: Technical Specifications

Technical specifications describe implementation units that realize behaviors. They are a flat catalog - each spec type stands alone and references behaviors it participates in.

---

## 5. Function Specification Format

Function specifications describe the **behavioral contract** of a single function. They focus on _intent_, not implementation.

### Structure

A function specification consists of:
1. A heading whose title is the **function signature**
2. A short description
3. A small set of keywords
4. Optional **Examples** with PreDB/PostDB (for functions that modify state)

### Keywords

- **Given** - input parameters and assumptions
- **Returns** - value or outcome returned
- **Calls** (optional) - direct dependencies

### Examples Section

For functions that modify database state (like server actions), include examples showing state transitions:

- **PreDB** - database state before execution (CSV format)
- **Steps** - function call and expected result using keywords:
  - `Call:` - invoke the function with specific inputs
  - `Returns:` - expected return value
  - `Throws:` - expected error (for error cases)
- **PostDB** - database state after execution (CSV format)

### Example (Simple Function)

```markdown
## validateProjectName(name: string): ValidationResult

Validates a project name against naming rules.

- Given: a project name string
- Returns: validation result with errors if invalid
```

### Example (Function with State Changes)

```markdown
## createProject(input: CreateProjectInput): Promise<Project>

Creates a new project for the authenticated user.

- Given: project name and authenticated user with "client" role
- Returns: the newly created project
- Calls: ProjectModel.findByNameAndUser, ProjectModel.create

### Example: Create project successfully

#### PreDB
users:
id, email, role
1, user@example.com, client

projects:
id, user_id, name, status
1, 1, Existing Project, active

#### Steps
* Call: createProject({ name: "New Project" }) as user 1
* Returns: { id: 2, name: "New Project", status: "draft", userId: 1 }

#### PostDB
projects:
id, user_id, name, status
1, 1, Existing Project, active
2, 1, New Project, draft

### Example: Reject duplicate name

#### PreDB
projects:
id, user_id, name
1, 1, My Project

#### Steps
* Call: createProject({ name: "My Project" }) as user 1
* Throws: "Project name already exists"

#### PostDB
projects:
id, user_id, name
1, 1, My Project
```

---

## 6. Class Specification Format

Class specifications describe **object-oriented units** including their state, methods, and relationships.

### Structure

A class specification consists of:
1. A heading naming the **class**
2. A short description of its responsibility
3. **Properties** (state)
4. **Methods** (which may reference Function specs)
5. Optional **relationships** (extends, implements, composes)

### Example

```markdown
# ProjectService

Manages project lifecycle operations including creation, updates, and deletion.

## Properties
- db: Database
- validator: ProjectValidator
- logger: Logger

## Methods
- create(input: NewProject): ProjectId
- update(id: ProjectId, changes: ProjectUpdate): Project
- delete(id: ProjectId): void
- findById(id: ProjectId): Project | null

## Relationships
- Implements: IProjectService
- Composes: ProjectValidator, Database
```

---

## 7. Component Specification Format

Component specifications describe **UI components** in terms of their inputs, state, and structure.

### Purpose

Component specifications answer:
- What inputs it accepts
- What state it owns locally
- What state it shares with other components
- How it is composed structurally

### Structure

A component specification consists of:
1. A heading naming the **component**
2. A short description
3. Optional **props** accepted by the component
4. A **state** section, grouped into Local and Shared
5. Optional **children** listing direct subcomponents

### Conventions

- The component name is an H1 heading
- All subsections are H2 headings
- State is always grouped under **Local** and **Shared**
- State entries use the format `name: type`
- Absence of a section is meaningful

### Example

```markdown
# CreateProjectForm

Renders the form used to create a new project.

## Props
- onSuccess: (projectId: number) => void

## State

### Local
- name: string
- isSubmitting: boolean

### Shared
- status: boolean
- result: string

## Children
- TextInput
- SubmitButton
- ErrorBanner
```

---

## 8. Hook Specification Format

Hook specifications describe the **entry point of a behavior** - the bridge between UI components and server actions.

### Purpose

Hook specifications answer:
- What behavior does this hook trigger?
- What is the handler function signature?
- What state does it manage?
- What does it return to components?

### Key Principle

**One behavior = One hook = One handler**

Each behavior has exactly one hook that serves as its entry point. The hook exports a single handler function prefixed with `handle` (e.g., `handleCreateProject`, `handleDeleteTask`). This handler is the trigger that initiates the behavior.

### Structure

A hook specification consists of:
1. A heading with the **hook signature**
2. A short description referencing the behavior
3. **Parameters** it accepts (optional)
4. **State** it manages internally
5. **Returns** - always includes `handle[Behavior]`, `isLoading`, and `error`
6. Optional **Dependencies** (other hooks it calls)
7. **Examples** - test scenarios for the handler using `PreState`/`Steps`/`PostState` (state changes, not database)

### Example

```markdown
# useCreateProject()

Entry point for the Create Project behavior. Validates input, performs optimistic updates, and calls the server action.

## State
- isLoading: boolean
- error: string | null

## Returns
- handleCreateProject: (name: string) => Promise<void> - triggers the behavior
- isLoading: boolean - submission in progress
- error: string | null - current error message

## Dependencies
- useSetAtom(projectsAtom) - for optimistic updates

## Examples

### Example: Create project successfully

#### PreState
projectsAtom: []
isLoading: false
error: null

#### Steps
* Call: handleCreateProject("New Project")
* Returns: void

#### PostState
projectsAtom: [{ id: 1, name: "New Project", status: "draft", pending: false }]
isLoading: false
error: null

### Example: Reject empty name

#### PreState
projectsAtom: []
isLoading: false
error: null

#### Steps
* Call: handleCreateProject("")
* Throws: "Name is required"

#### PostState
projectsAtom: []
isLoading: false
error: "Name is required"
```

---

# Principles

- Behavior is the bridge between Functional and Technical specs
- Functional specs describe _what_, Technical specs describe _how_
- Functional specs are hierarchical (Project → Flow → Page → Behavior)
- Technical specs are a flat catalog (Function, Class, Component, Hook)
- State ownership is always explicit
- Omitted sections are meaningful
- Formats are minimal and consistent

This system is documentation, but also a **design and reasoning tool**.
