import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { CommunityModerationCase, InsertUser, PublishedMeal, UserMealLog, communityModerationCases, moderationAuditLogs, publishedMeals, userMealLogs, users } from "../drizzle/schema";
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

export type UserTopMeal = {
  mealSlug: string;
  mealName: string;
  category: "Vegetarian" | "Non Vegetarian";
  timesLogged: number;
  totalServings: number;
  lastLoggedAt: Date;
};

type TopMealLog = Pick<UserMealLog, "mealSlug" | "mealName" | "category" | "servings" | "loggedAt">;

export function summariseUserTopMeals(logs: TopMealLog[], limit = 5): UserTopMeal[] {
  const grouped = new Map<string, UserTopMeal>();

  for (const log of logs) {
    const existing = grouped.get(log.mealSlug);
    if (existing) {
      existing.timesLogged += 1;
      existing.totalServings += log.servings;
      if (log.loggedAt.getTime() > existing.lastLoggedAt.getTime()) existing.lastLoggedAt = log.loggedAt;
      continue;
    }

    grouped.set(log.mealSlug, {
      mealSlug: log.mealSlug,
      mealName: log.mealName,
      category: log.category,
      timesLogged: 1,
      totalServings: log.servings,
      lastLoggedAt: log.loggedAt,
    });
  }

  return Array.from(grouped.values())
    .sort((first, second) => second.timesLogged - first.timesLogged || second.totalServings - first.totalServings || second.lastLoggedAt.getTime() - first.lastLoggedAt.getTime() || first.mealName.localeCompare(second.mealName))
    .slice(0, limit);
}

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

export async function listUserTopMeals(userId: number): Promise<UserTopMeal[]> {
  return summariseUserTopMeals(await listUserMealLogs(userId));
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

export type ModerationReason = "private_information" | "unkind_or_harmful" | "off_topic" | "safety_concern" | "other";
export type ModerationAction = "restored" | "hidden" | "removed";

export type ModerationCaseInput = {
  postClientId: string;
  displayName: string;
  mealsLogged: number;
  weeklyFootprintHundredths: number;
  message: string;
};

export type ModerationAuditRecord = {
  id: number;
  moderationCaseId: number;
  displayName: string;
  message: string;
  action: ModerationAction;
  reason: ModerationReason;
  teacherName: string | null;
  createdAt: Date;
};

export async function reportCommunityPost(userId: number, input: ModerationCaseInput): Promise<void> {
  const db = requireDatabase(await getDb());
  const now = new Date();
  await db.insert(communityModerationCases).values({
    ...input,
    reportedByUserId: userId,
    status: "reported",
    reportedAt: now,
    resolvedAt: null,
  }).onDuplicateKeyUpdate({
    set: {
      displayName: input.displayName,
      mealsLogged: input.mealsLogged,
      weeklyFootprintHundredths: input.weeklyFootprintHundredths,
      message: input.message,
      reportedByUserId: userId,
      status: "reported",
      reportedAt: now,
      resolvedAt: null,
    },
  });
}

export async function listOpenModerationCases(): Promise<CommunityModerationCase[]> {
  const db = requireDatabase(await getDb());
  return db.select().from(communityModerationCases).where(eq(communityModerationCases.status, "reported")).orderBy(desc(communityModerationCases.reportedAt));
}

export async function listHiddenCommunityPostIds(): Promise<string[]> {
  const db = requireDatabase(await getDb());
  const cases = await db.select({ postClientId: communityModerationCases.postClientId, status: communityModerationCases.status }).from(communityModerationCases);
  return cases.filter((item) => item.status === "hidden" || item.status === "removed").map((item) => item.postClientId);
}

export async function resolveModerationCase(teacherUserId: number, moderationCaseId: number, action: ModerationAction, reason: ModerationReason): Promise<boolean> {
  const db = requireDatabase(await getDb());
  const status = action === "restored" ? "restored" : action === "hidden" ? "hidden" : "removed";
  const result = await db.update(communityModerationCases).set({ status, resolvedAt: new Date() }).where(and(eq(communityModerationCases.id, moderationCaseId), eq(communityModerationCases.status, "reported")));
  if (result[0].affectedRows === 0) return false;
  await db.insert(moderationAuditLogs).values({ moderationCaseId, teacherUserId, action, reason });
  return true;
}

export async function listModerationAudit(): Promise<ModerationAuditRecord[]> {
  const db = requireDatabase(await getDb());
  const records = await db.select({
    id: moderationAuditLogs.id,
    moderationCaseId: moderationAuditLogs.moderationCaseId,
    displayName: communityModerationCases.displayName,
    message: communityModerationCases.message,
    action: moderationAuditLogs.action,
    reason: moderationAuditLogs.reason,
    teacherName: users.name,
    createdAt: moderationAuditLogs.createdAt,
  }).from(moderationAuditLogs)
    .innerJoin(communityModerationCases, eq(moderationAuditLogs.moderationCaseId, communityModerationCases.id))
    .innerJoin(users, eq(moderationAuditLogs.teacherUserId, users.id))
    .orderBy(desc(moderationAuditLogs.createdAt))
    .limit(50);
  return records as ModerationAuditRecord[];
}
