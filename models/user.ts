import { db } from "@/db";
import { user, InsertUser, SelectUser } from "@/db/schema";
import { eq, and, SQL, getTableColumns, isNull } from "drizzle-orm";
import crypto from "crypto";

export type User = typeof user.$inferSelect & {};

export class UserModel {
  id?: string;
  name?: string | null;
  email?: string;
  emailVerified?: boolean;
  image?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;

  constructor() {}

  static async find(id: string): Promise<User | null> {
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (userData.length === 0) {
      return null;
    }
    return userData[0];
  }

  static async where(attributes: Partial<SelectUser>): Promise<User[]> {
    const tableDefinition = user;
    const columns = getTableColumns(tableDefinition);
    const conditions: SQL[] = [];

    for (const key in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, key)) {
        const attributeKey = key as keyof SelectUser;
        const columnKey = key as keyof typeof columns;
        const attributeValue = attributes[attributeKey];

        if (columns[columnKey]) {
          if (attributeValue === null) {
            conditions.push(isNull(columns[columnKey]));
          } else if (attributeValue !== undefined) {
            conditions.push(eq(columns[columnKey], attributeValue));
          }
        }
      }
    }

    let query;
    if (conditions.length > 0) {
      query = db
        .select()
        .from(tableDefinition)
        .where(and(...conditions));
    } else {
      query = db.select().from(tableDefinition);
    }

    const userData = await query;
    return userData.map((u) => u);
  }

  async save(): Promise<User> {
    if (this.id) {
      // Update existing user
      const now = new Date();
      const updatedUsers = await db
        .update(user)
        .set({ name: this.name, email: this.email, updatedAt: now })
        .where(eq(user.id, this.id))
        .returning();
      if (updatedUsers.length === 0) {
        throw new Error("User not found for update");
      }
      const updatedData = updatedUsers[0];
      this.name = updatedData.name;
      this.email = updatedData.email;
      this.updatedAt = updatedData.updatedAt;
      // this.createdAt remains unchanged on update
    } else {
      // Validate required fields
      if (!this.email) {
        throw new Error("Email is required");
      }

      // Create new user
      const newId = this.id || crypto.randomUUID();
      const now = new Date();

      const insertData: InsertUser = {
        id: newId,
        name: this.name || null,
        email: this.email,
        emailVerified: false, // Default value
        createdAt: now, // Set createdAt
        updatedAt: now, // Set updatedAt
      };

      const newUsers = await db.insert(user).values(insertData).returning();
      if (newUsers.length === 0) {
        throw new Error("Failed to create user");
      }
      const newUser = newUsers[0];
      this.id = newUser.id;
      this.name = newUser.name;
      this.email = newUser.email;
      this.createdAt = newUser.createdAt;
      this.updatedAt = newUser.updatedAt;
    }
    return this as unknown as User;
  }

  async update(
    attributes: Partial<Pick<SelectUser, "name" | "email">>
  ): Promise<User> {
    if (!this.id) {
      throw new Error(
        "Cannot update a user that has not been saved. Call save() first for new users."
      );
    }

    const setData: Partial<Pick<InsertUser, "name" | "email" | "updatedAt">> =
      {};

    if (attributes.name !== undefined) {
      setData.name = attributes.name;
    }
    if (attributes.email !== undefined) {
      setData.email = attributes.email;
    }

    if (Object.keys(setData).length === 0) {
      // No attributes to update
      return this as unknown as User;
    }

    setData.updatedAt = new Date();

    const updatedUsers = await db
      .update(user)
      .set(setData)
      .where(eq(user.id, this.id))
      .returning();

    if (updatedUsers.length === 0) {
      // This case should ideally not be reached if `this.id` is valid and record exists
      throw new Error("User not found for update, or update failed.");
    }

    const updatedDbData = updatedUsers[0];

    // Update instance properties from the returned data
    if (updatedDbData.name !== undefined) this.name = updatedDbData.name;
    if (updatedDbData.email) this.email = updatedDbData.email;
    if (updatedDbData.updatedAt) this.updatedAt = updatedDbData.updatedAt;
    // Note: `this.createdAt` should remain unchanged.

    return this as unknown as User;
  }
}

export default User;
