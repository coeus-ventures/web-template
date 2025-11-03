import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  role: text("role"),
  banned: integer("banned", { mode: "boolean" }),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
});

export type InsertUser = typeof user.$inferInsert;
export type SelectUser = typeof user.$inferSelect;

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  impersonatedBy: text("impersonated_by"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export type InsertSession = typeof session.$inferInsert;
export type SelectSession = typeof session.$inferSelect;

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type InsertAccount = typeof account.$inferInsert;
export type SelectAccount = typeof account.$inferSelect;

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export type InsertVerification = typeof verification.$inferInsert;
export type SelectVerification = typeof verification.$inferSelect;

export const authTokens = sqliteTable("auth_tokens", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  callbackUrl: text("callback_url"),
  uaHash: text("ua_hash"),
  expiresAt: integer("expires_at").notNull(), // Unix timestamp in milliseconds
  consumedAt: integer("consumed_at"), // Unix timestamp in milliseconds
  createdAt: integer("created_at").notNull(), // Unix timestamp in milliseconds
});

export type InsertAuthToken = typeof authTokens.$inferInsert;
export type SelectAuthToken = typeof authTokens.$inferSelect;

export const magicLinks = sqliteTable("magic_links", {
  cid: text("cid").primaryKey(),
  email: text("email").notNull(),
  verifyUrl: text("verify_url").notNull(),
  expiresAt: integer("expires_at").notNull(), // Unix timestamp in milliseconds
  createdAt: integer("created_at").notNull(), // Unix timestamp in milliseconds
});

export type InsertMagicLink = typeof magicLinks.$inferInsert;
export type SelectMagicLink = typeof magicLinks.$inferSelect;
