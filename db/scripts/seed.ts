import { db } from "../index";
import { user } from "../schema";
import { randomUUID } from "crypto";

async function seed() {
  try {
    console.log("Starting seed process...");

    const now = new Date();

    // Insert seed data with all required Better Auth fields
    const users = await db
      .insert(user)
      .values([
        {
          id: randomUUID(),
          name: "John Doe",
          email: "john@example.com",
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: randomUUID(),
          name: "Jane Smith",
          email: "jane@example.com",
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .returning();

    console.log("✅ Seed data inserted successfully");
    console.log(`Inserted ${users.length} users`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
