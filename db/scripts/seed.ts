import { auth } from "../../lib/auth";
import { userSeed } from "../seed/user.seed";

async function seed() {
  try {
    console.log("Starting seed process...");

    // Use Better Auth API to create user with properly hashed password
    const result = await auth.api.signUpEmail({
      body: {
        email: userSeed.email,
        password: userSeed.password,
        name: "Test User",
      },
    });

    if (!result || !result.user) {
      throw new Error("Failed to create test user");
    }

    console.log(`✅ Created test user: ${result.user.email}`);
    console.log("✅ Seed data inserted successfully");
    console.log(`Test credentials: ${userSeed.email} / ${userSeed.password}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
