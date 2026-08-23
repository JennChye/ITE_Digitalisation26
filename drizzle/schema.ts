import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const publishedMeals = mysqlTable("publishedMeals", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  carbonHundredths: int("carbonHundredths").notNull(),
  category: mysqlEnum("category", ["Vegetarian", "Non Vegetarian"]).notNull(),
  estimateMethod: mysqlEnum("estimateMethod", ["published_research", "regional_research", "prototype_estimate"]).notNull(),
  sourceLabel: varchar("sourceLabel", { length: 255 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 512 }).notNull(),
  sourcePublishedOn: varchar("sourcePublishedOn", { length: 16 }).notNull(),
  factorsJson: text("factorsJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("publishedMeals_slug_unique").on(table.slug)]);

export const userMealLogs = mysqlTable("userMealLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientLogId: varchar("clientLogId", { length: 96 }).notNull(),
  mealSlug: varchar("mealSlug", { length: 128 }).notNull(),
  mealName: varchar("mealName", { length: 255 }).notNull(),
  carbonHundredths: int("carbonHundredths").notNull(),
  servings: int("servings").notNull(),
  category: mysqlEnum("category", ["Vegetarian", "Non Vegetarian"]).notNull(),
  entryMethod: mysqlEnum("entryMethod", ["camera", "manual", "custom"]).notNull(),
  localDate: varchar("localDate", { length: 10 }).notNull(),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("userMealLogs_user_client_log_unique").on(table.userId, table.clientLogId),
  index("userMealLogs_user_date_index").on(table.userId, table.localDate),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type PublishedMeal = typeof publishedMeals.$inferSelect;
export type UserMealLog = typeof userMealLogs.$inferSelect;
