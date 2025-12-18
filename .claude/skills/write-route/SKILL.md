---
name: write-route
description: Write API routes following the Epic architecture patterns. Use when creating REST endpoints, webhooks, or server-side route handlers. Triggers on "create a route", "add an API endpoint", or "write a route for".
---

# Write Route

## Overview

This skill creates API routes that follow the Epic three-layer architecture. Routes belong to the **Backend layer** and handle HTTP requests, authentication, and orchestration of model/integration calls.

## Architecture Context

```
External Client: HTTP Request
                   |
                   v
Backend: API Routes (auth + validation + orchestration)
                   |
                   v
Infrastructure: Models + Integrations
```

Routes:
- Run on the server (Backend layer)
- Handle HTTP methods (GET, POST, PUT, DELETE)
- Check authentication when required
- Validate request data
- Call models for data operations
- Return proper HTTP responses

## Route Location

```
app/api/
  [resource]/
    route.ts              # Handles /api/[resource]
    [id]/
      route.ts            # Handles /api/[resource]/[id]
```

## Function Specification Format

Follow the Epic Function specification format:

```markdown
## GET /api/projects

Returns all projects for the authenticated user.

- Given: authenticated user with valid session
- Returns: array of projects
- Calls: ProjectModel.findByUserId

### Example: List user projects

#### Preconditions
projects:
id, user_id, name
1, 1, Project A
2, 1, Project B

#### Postconditions
(no changes - read operation)

Response: { success: true, data: [{ id: 1, name: "Project A" }, ...] }
```

## Implementation Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { Model } from '@/shared/models/model-name';
import { z } from 'zod';

// GET /api/resource
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await Model.findByUserId(user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/resource error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/resource
const CreateSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = CreateSchema.parse(body);

    const created = await Model.create({
      ...validated,
      userId: user.id,
    });

    return NextResponse.json(
      { success: true, data: created },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('POST /api/resource error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Dynamic Route Pattern

```typescript
// app/api/resource/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const item = await Model.findById(id);
  if (!item) {
    return NextResponse.json(
      { success: false, error: 'Not found' },
      { status: 404 }
    );
  }

  // Check ownership
  if (item.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, data: item });
}
```

## Webhook Pattern

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/shared/integrations/stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { success: false, error: 'Missing signature' },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        // Handle event
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook failed' },
      { status: 400 }
    );
  }
}
```

## HTTP Status Codes

- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no auth)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Internal Server Error

## Constraints

- NEVER import React, Jotai, or frontend code
- NEVER access database directly - use models
- ALWAYS check authentication when required
- ALWAYS validate request body with Zod
- ALWAYS return consistent response format
- ALWAYS use proper HTTP status codes
- ALWAYS log errors for debugging

## Example Specification

```markdown
## POST /api/projects

Creates a new project for the authenticated user.

- Given: valid project data and authenticated user
- Returns: created project with 201 status
- Calls: ProjectModel.create

### Example: Create project successfully

#### Preconditions
projects:
id, user_id, name
(empty)

Request: { name: "New Project" }

#### Postconditions
projects:
id, user_id, name, created_at
1, 1, New Project, <timestamp>

Response: { success: true, data: { id: 1, name: "New Project", ... } }
Status: 201
```
