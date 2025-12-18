# Three-Layer Architecture Reference

> A uni-directional layering model that keeps React UI, server logic, and external integrations cleanly separated.

## Architecture Overview

```
+-------------------------------------+
|          FRONTEND LAYER             |
|   Components -> Hooks -> States     |
|          (Browser)                  |
+-------------------------------------+
              |
              v
+-------------------------------------+
|         BACKEND LAYER               |
|   Actions + Routes + Workflows      |
|          (Server)                   |
+-------------------------------------+
              |
              v
+-------------------------------------+
|      INFRASTRUCTURE LAYER           |
|    Integrations  +  Models          |
|          (Server)                   |
+-------------------------------------+
```

**Critical Rule**: Data flows top to bottom only. No layer may import from layers above it.

---

## Layer Responsibilities

### Frontend Layer (Browser)

| Component | Responsibility |
|-----------|----------------|
| **Components** | Render UI, collect user input, consume hooks |
| **Hooks** | Validate input (Zod), manage state (Jotai), optimistic updates, call Actions |
| **States** | Jotai atoms for client-side state |

**May import**: React, Zod, Jotai, Actions

**Must NOT import**: Database clients, Drizzle, Integrations, Models, server-only code

---

### Backend Layer (Server)

| Component | Responsibility |
|-----------|----------------|
| **Actions** | Auth-aware business logic, orchestrate Integrations |
| **Routes** | API endpoints and server-side routing |
| **Workflows** | Long-running background jobs/processes |

**May import**: Integrations, Models, auth/context utilities

**Must NOT import**: React, `window`, Jotai atoms, direct database queries

---

### Infrastructure Layer (Server)

The Infrastructure layer handles all communication with the external world: databases, third-party APIs, file systems, and external services.

| Component | Responsibility |
|-----------|----------------|
| **Models** | Database access via Drizzle ORM (Active Record pattern) |
| **Integrations** | External API clients (email, payments, storage, etc.) |

**May import**: Drizzle/SQL client, external APIs, SDKs

**Must NOT import**: React, Jotai, Actions, Hooks, Components

---

## One-Way Data Flow

- **Infrastructure** never calls **Backend** or **Frontend**
- **Backend** never calls **Frontend**
- **Frontend** Components never contain server code or manage atoms directly
- **Frontend** Hooks never touch the database directly

```
Component -> Hook -> Action -> Integration -> Database
                                    |
                                    v
                              External API
```

---

## Import Rules Summary

| From / To | Frontend | Backend | Infrastructure |
|-----------|----------|---------|----------------|
| **Frontend** | Yes | Yes (Actions only) | No |
| **Backend** | No | Yes | Yes |
| **Infrastructure** | No | No | Yes |

---

## File Locations

| Layer | Location | File Pattern |
|-------|----------|--------------|
| Components | `app/[page]/components/` | `PascalCase.tsx` |
| Hooks | `app/[page]/behaviors/[name]/` | `use-[name].ts` |
| States | `app/[page]/behaviors/[name]/` | `state.ts` |
| Actions | `app/[page]/behaviors/[name]/` | `[name].action.ts` |
| Routes | `app/api/` | `route.ts` |
| Integrations | `shared/integrations/` | `[name].ts` |
| Models | `shared/models/` | `[name].ts` |

---

## Sharing Hierarchy

Code can be shared at three levels, following the same structure at each scope:

```
shared/                              <- Global: shared across all pages
  integrations/
  models/
  actions/
  hooks/
  states/

app/[page]/
  shared/                            <- Page-level: shared between behaviors
    state.ts
    actions/
    hooks/
  behaviors/
    [behavior-name]/
      state.ts                       <- Behavior-level: specific to this behavior
      use-[name].ts
      [name].action.ts
```

### Scope Rules

| Scope | Location | Shared Between |
|-------|----------|----------------|
| **Behavior** | `behaviors/[name]/` | Nothing (behavior-specific) |
| **Page** | `app/[page]/shared/` | Behaviors within the same page |
| **Global** | `shared/` | All pages and behaviors |

### When to Use Each Level

**Behavior-level** (default):
- State, hooks, and actions specific to one behavior
- Start here; promote to higher levels only when needed

**Page-level shared**:
- State shared between 2+ behaviors on the same page
- Actions or hooks reused within the same page

**Global shared**:
- Models and Integrations (always global)
- Code needed by 2+ pages
- Core utilities used throughout the app
