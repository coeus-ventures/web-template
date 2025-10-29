import { db } from '../index';
import { user, post } from '../schema';

async function seed() {
  try {
    console.log('Starting seed process...');

    // Insert seed data
    const users = await db.insert(user).values([
      {
        name: 'John Doe',
        email: 'john@example.com',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    ]).returning();

    await db.insert(post).values([
      {
        title: 'First Post',
        content: 'This is the first post',
        userId: users[0].id,
      },
      {
        title: 'Second Post',
        content: 'This is the second post',
        userId: users[1].id,
      },
    ]);

    console.log('✅ Seed data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
