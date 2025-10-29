import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Type exports for use in application code
export type InsertUser = typeof user.$inferInsert;
export type SelectUser = typeof user.$inferSelect;

export const post = sqliteTable("post", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type InsertPost = typeof post.$inferInsert;
export type SelectPost = typeof post.$inferSelect;

export const authTokens = sqliteTable("auth_tokens", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  callbackUrl: text("callback_url"),
  uaHash: text("ua_hash"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  consumedAt: integer("consumed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type InsertAuthToken = typeof authTokens.$inferInsert;
export type SelectAuthToken = typeof authTokens.$inferSelect;

export const magicLinks = sqliteTable("magic_links", {
  cid: text("cid").primaryKey(),
  email: text("email").notNull(),
  verifyUrl: text("verify_url").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type InsertMagicLink = typeof magicLinks.$inferInsert;
export type SelectMagicLink = typeof magicLinks.$inferSelect;
