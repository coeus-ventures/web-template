# INF-1 Implement Dreamer Agent

Generates creative product ideas based on the archive of past attempts.

# Functional Specifications

## Create new idea with empty archive

### Preconditions
idea:
(empty table)

### Workflow
* Call `dreamer.create()`
* LLM generates initial seed idea
* Idea description is embedded using text-embedding-3-large (3072 dimensions)
* Idea is saved to database with embedding
* Returns Idea object

### Postconditions
idea:
id, description, embedding, createdAt
<uuid>, "A simple task management app", <3072-dim vector>, <timestamp>

## Create new idea with successful products in archive

### Preconditions
idea:
id, description, embedding, createdAt
idea-1, "Todo list app", <vector-1>, <timestamp-1>
idea-2, "Blog platform", <vector-2>, <timestamp-2>
product:
id, specId, status
prod-1, spec-1, complete
prod-2, spec-2, complete
spec:
id, ideaId
spec-1, idea-1
spec-2, idea-2

### Workflow
* Call `dreamer.create()`
* Dreamer queries archive for successful products
* LLM receives successful product ideas as context
* LLM generates new idea building on successful patterns
* New idea is embedded using text-embedding-3-large
* Idea is saved to database
* Returns Idea object

### Postconditions
idea:
id, description, embedding, createdAt
idea-1, "Todo list app", <vector-1>, <timestamp-1>
idea-2, "Blog platform", <vector-2>, <timestamp-2>
idea-3, "Collaborative kanban board", <vector-3>, <timestamp-3>

## Create new idea with failed products in archive

### Preconditions
idea:
id, description, embedding, createdAt
idea-1, "Complex real-time game engine", <vector-1>, <timestamp-1>
product:
id, specId, status
prod-1, spec-1, failed
spec:
id, ideaId
spec-1, idea-1

### Workflow
* Call `dreamer.create()`
* Dreamer queries archive for failed products
* LLM receives failed product ideas as context
* LLM generates new idea avoiding overly complex patterns
* New idea is more learnable given current skill level
* Idea is embedded and saved
* Returns Idea object

### Postconditions
idea:
id, description, embedding, createdAt
idea-1, "Complex real-time game engine", <vector-1>, <timestamp-1>
idea-2, "Simple note-taking app", <vector-2>, <timestamp-2>

## Create new idea with both successful and failed products

### Preconditions
idea:
id, description, embedding, createdAt
idea-1, "Todo list app", <vector-1>, <timestamp-1>
idea-2, "Complex real-time game", <vector-2>, <timestamp-2>
product:
id, specId, status
prod-1, spec-1, complete
prod-2, spec-2, failed
spec:
id, ideaId
spec-1, idea-1
spec-2, idea-2

### Workflow
* Call `dreamer.create()`
* Dreamer queries archive for both successful and failed products
* LLM receives both as context (successful as stepping stones, failed to avoid)
* LLM generates new idea that:
  - Builds on successful patterns
  - Avoids complexity that led to failures
  - Progresses toward more challenging tasks appropriately
* Idea is embedded using text-embedding-3-large (3072 dimensions)
* Idea is saved to database
* Returns Idea object

### Postconditions
idea:
id, description, embedding, createdAt
idea-1, "Todo list app", <vector-1>, <timestamp-1>
idea-2, "Complex real-time game", <vector-2>, <timestamp-2>
idea-3, "Todo app with real-time sync", <vector-3>, <timestamp-3>

---

# Technical Specifications

## Database Schema

Create the Idea table with vector support:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Custom vector type for Turso
const float32Array = customType<{ data: number[]; driverData: Buffer }>({
  dataType(config) {
    return `F32_BLOB(${config.dimensions})`;
  },
  toDriver(value: number[]): Buffer {
    return sql`vector32(${JSON.stringify(value)})`;
  },
});

export const idea = sqliteTable('idea', {
  id: text('id').primaryKey(),
  description: text('description').notNull(),
  embedding: float32Array('embedding', { dimensions: 3072 }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  vectorIdx: index('idea_vector_idx').on(table.embedding).using(sql`vector_cosine(3072)`),
}));

export type InsertIdea = typeof idea.$inferInsert;
export type SelectIdea = typeof idea.$inferSelect;
```

## Dreamer Class

```typescript
export class Dreamer {
  constructor(
    private readonly db: Database,
    private readonly aiModel: LanguageModel, // AI SDK model
    private readonly embeddingModel: EmbeddingModel
  ) {}

  async create(): Promise<SelectIdea> {
    // 1. Query archive for successful products
    const successful = await this.getSuccessfulProducts();

    // 2. Query archive for failed products
    const failed = await this.getFailedProducts();

    // 3. Generate idea using LLM
    const description = await this.generateIdea(successful, failed);

    // 4. Embed the idea
    const embedding = await this.embedIdea(description);

    // 5. Save to database
    const idea = await this.saveIdea(description, embedding);

    return idea;
  }

  private async getSuccessfulProducts(): Promise<ArchiveProduct[]> {
    // Query products with status='complete' + their specs + ideas
  }

  private async getFailedProducts(): Promise<ArchiveProduct[]> {
    // Query products with status='failed' + their specs + ideas
  }

  private async generateIdea(
    successful: ArchiveProduct[],
    failed: ArchiveProduct[]
  ): Promise<string> {
    // Use AI SDK to generate idea based on OMNI-EPIC prompt
  }

  private async embedIdea(description: string): Promise<number[]> {
    // Use text-embedding-3-large to generate 3072-dim vector
  }

  private async saveIdea(
    description: string,
    embedding: number[]
  ): Promise<SelectIdea> {
    // Insert into database and return
  }
}
```

## LLM Prompt Template

Based on OMNI-EPIC's idea generation prompt:

```
You are an expert in curriculum learning and product development.
Your goal is to help an AI system master a diverse set of interesting
web products using Next.js.

You will be provided with the list of products that the AI has successfully
implemented, along with their descriptions, and the list of products that
the AI attempted but failed to implement.

Your objective is to decide the next product idea, selecting one that will
maximize learning effectiveness based on past successes and failures.

Instructions:
- The next product should be learnable:
  - Not too difficult to implement given current skill set
  - Realistic for Next.js/React/TypeScript stack
  - Possible to test with Playwright E2E tests
- The next product should be interesting, i.e., either:
  - Novel compared to products already implemented
  - Useful according to humans, making it worth learning
  - Creative or surprising
- Be specific in the product description:
  - State clearly what the product does
  - List key features and behaviors
  - Be specific about user interactions and data models
- The product should not take too long to implement
- Return only the product description, not implementation details

Successfully implemented products:
{successful_products}

Failed products:
{failed_products}

Desired format:
Reasoning for what the next product should be: <reasoning>

Next product description: """
<description>
"""
```

## Tasks

- [ ] Create Idea table schema with vector embedding support
  - [ ] Define custom float32Array type for Turso vectors
  - [ ] Create table with id, description, embedding (3072 dims), createdAt
  - [ ] Add vector_cosine index for similarity search
  - [ ] Generate and run migration
- [ ] Implement archive query methods
  - [ ] Create `getSuccessfulProducts()` - query products with status='complete' + joins
  - [ ] Create `getFailedProducts()` - query products with status='failed' + joins
- [ ] Implement LLM integration for idea generation
  - [ ] Create OMNI-EPIC-inspired prompt template
  - [ ] Implement `generateIdea()` using AI SDK
  - [ ] Handle successful products context
  - [ ] Handle failed products context
  - [ ] Handle empty archive (seed case)
- [ ] Implement embedding generation
  - [ ] Set up text-embedding-3-large client
  - [ ] Create `embedIdea()` method
  - [ ] Generate 3072-dimensional vectors
- [ ] Implement Dreamer class
  - [ ] Create class constructor with db, aiModel, embeddingModel dependencies
  - [ ] Implement `create()` method orchestrating the flow
  - [ ] Implement `saveIdea()` to persist to database
- [ ] Write tests for all 4 scenarios
  - [ ] Test: Create idea with empty archive
  - [ ] Test: Create idea with successful products
  - [ ] Test: Create idea with failed products
  - [ ] Test: Create idea with mixed archive