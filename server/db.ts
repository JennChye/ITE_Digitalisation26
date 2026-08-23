import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, PublishedMeal, UserMealLog, publishedMeals, userMealLogs, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export type CloudMealInput = {
  clientLogId: string;
  mealSlug: string;
  mealName: string;
  carbonHundredths: number;
  servings: number;
  category: "Vegetarian" | "Non Vegetarian";
  entryMethod: "camera" | "manual" | "custom";
  localDate: string;
  loggedAt: Date;
};

function requireDatabase<T>(database: T | null): T {
  if (!database) throw new Error("Cloud meal storage is not available. Please try again.");
  return database;
}

export async function listPublishedMeals(): Promise<PublishedMeal[]> {
  const db = requireDatabase(await getDb());
  return db.select().from(publishedMeals).orderBy(asc(publishedMeals.name));
}

export async function listUserMealLogs(userId: number): Promise<UserMealLog[]> {
  const db = requireDatabase(await getDb());
  return db.select().from(userMealLogs).where(eq(userMealLogs.userId, userId)).orderBy(desc(userMealLogs.loggedAt));
}

export async function upsertUserMealLog(userId: number, input: CloudMealInput): Promise<void> {
  const db = requireDatabase(await getDb());
  await db.insert(userMealLogs).values({ userId, ...input }).onDuplicateKeyUpdate({
    set: {
      mealSlug: input.mealSlug,
      mealName: input.mealName,
      carbonHundredths: input.carbonHundredths,
      servings: input.servings,
      category: input.category,
      entryMethod: input.entryMethod,
      localDate: input.localDate,
      loggedAt: input.loggedAt,
    },
  });
}

export async function updateUserMealLogServings(userId: number, id: number, servings: number): Promise<boolean> {
  const db = requireDatabase(await getDb());
  const result = await db.update(userMealLogs).set({ servings }).where(and(eq(userMealLogs.id, id), eq(userMealLogs.userId, userId)));
  return result[0].affectedRows > 0;
}

export async function deleteUserMealLog(userId: number, id: number): Promise<boolean> {
  const db = requireDatabase(await getDb());
  const result = await db.delete(userMealLogs).where(and(eq(userMealLogs.id, id), eq(userMealLogs.userId, userId)));
  return result[0].affectedRows > 0;
}

export async function clearUserMealLogsForDate(userId: number, localDate: string): Promise<void> {
  const db = requireDatabase(await getDb());
  await db.delete(userMealLogs).where(and(eq(userMealLogs.userId, userId), eq(userMealLogs.localDate, localDate)));
}
