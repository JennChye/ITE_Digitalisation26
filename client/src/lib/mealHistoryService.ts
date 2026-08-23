import { FoodCategory } from "./foodDatabase";
import {
  calculateTotalCarbonFootprint,
  MIN_SERVINGS,
  normaliseServings,
} from "./mealFootprint";

export const MEAL_HISTORY_STORAGE_KEY = "platefootprint-meal-history-v1";
export const EMPTY_HISTORY_MESSAGE = "No meals logged yet for this day. Choose a meal to start your journal.";
export type EntryMethod = "camera" | "manual" | "custom";

export type MealLog = {
  id: string;
  mealId: string;
  mealName: string;
  carbonFootprintPerServing: number;
  servings: number;
  totalCarbonFootprint: number;
  loggedAt: string;
  localDate: string;
  category: FoodCategory;
  entryMethod: EntryMethod;
};

export type MealLogInput = Omit<MealLog, "id" | "totalCarbonFootprint" | "loggedAt" | "localDate" | "entryMethod"> & {
  loggedAt?: Date;
  entryMethod?: EntryMethod;
};

export type DailySummary = {
  mealCount: number;
  totalCarbonFootprint: number;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getStorage(storage?: StorageLike | null): StorageLike | null {
  return storage === undefined ? getBrowserStorage() : storage;
}

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createLogId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `meal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isStoredMealLog(value: unknown): value is Omit<MealLog, "entryMethod"> & { entryMethod?: EntryMethod } {
  if (!value || typeof value !== "object") return false;

  const log = value as Record<string, unknown>;
  return (
    typeof log.id === "string" &&
    typeof log.mealId === "string" &&
    typeof log.mealName === "string" &&
    typeof log.carbonFootprintPerServing === "number" &&
    typeof log.servings === "number" &&
    typeof log.totalCarbonFootprint === "number" &&
    typeof log.loggedAt === "string" &&
    typeof log.localDate === "string" &&
    (log.category === "Vegetarian" || log.category === "Non Vegetarian") &&
    (log.entryMethod === undefined || log.entryMethod === "camera" || log.entryMethod === "manual" || log.entryMethod === "custom")
  );
}

function writeMealLogs(logs: MealLog[], storage?: StorageLike | null): void {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return;

  try {
    targetStorage.setItem(MEAL_HISTORY_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // Storage can be unavailable or full. The application continues with the current view state.
  }
}

export function readMealLogs(storage?: StorageLike | null): MealLog[] {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return [];

  try {
    const rawValue = targetStorage.getItem(MEAL_HISTORY_STORAGE_KEY);
    if (!rawValue) return [];

    const parsedValue: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue) || !parsedValue.every(isStoredMealLog)) return [];

    return parsedValue.map((log) => ({ ...log, entryMethod: log.entryMethod ?? "manual" }));
  } catch {
    return [];
  }
}

export function addMealLog(input: MealLogInput, storage?: StorageLike | null): MealLog {
  const loggedAt = input.loggedAt ?? new Date();
  const servings = normaliseServings(input.servings);
  const log: MealLog = {
    id: createLogId(),
    mealId: input.mealId,
    mealName: input.mealName,
    carbonFootprintPerServing: input.carbonFootprintPerServing,
    servings,
    totalCarbonFootprint: calculateTotalCarbonFootprint(input.carbonFootprintPerServing, servings),
    loggedAt: loggedAt.toISOString(),
    localDate: getLocalDateKey(loggedAt),
    category: input.category,
    entryMethod: input.entryMethod ?? "manual",
  };

  const logs = readMealLogs(storage);
  writeMealLogs([log, ...logs], storage);
  return log;
}

export function getLogsForDate(logs: MealLog[], localDate: string): MealLog[] {
  return logs
    .filter((log) => log.localDate === localDate)
    .sort((first, second) => new Date(second.loggedAt).getTime() - new Date(first.loggedAt).getTime());
}

export function calculateDailySummary(logs: MealLog[], localDate: string): DailySummary {
  const logsForDate = getLogsForDate(logs, localDate);
  const totalCarbonFootprint = logsForDate.reduce((total, log) => total + log.totalCarbonFootprint, 0);

  return {
    mealCount: logsForDate.length,
    totalCarbonFootprint: Number(totalCarbonFootprint.toFixed(2)),
  };
}

export function updateMealLogServings(
  id: string,
  servings: number,
  storage?: StorageLike | null,
): MealLog[] {
  const updatedLogs = readMealLogs(storage).map((log) => {
    if (log.id !== id) return log;

    const updatedServings = normaliseServings(servings);
    return {
      ...log,
      servings: updatedServings,
      totalCarbonFootprint: calculateTotalCarbonFootprint(log.carbonFootprintPerServing, updatedServings),
    };
  });

  writeMealLogs(updatedLogs, storage);
  return updatedLogs;
}

export function deleteMealLog(id: string, storage?: StorageLike | null): MealLog[] {
  const updatedLogs = readMealLogs(storage).filter((log) => log.id !== id);
  writeMealLogs(updatedLogs, storage);
  return updatedLogs;
}

export function clearMealLogsForDate(localDate: string, storage?: StorageLike | null): MealLog[] {
  const updatedLogs = readMealLogs(storage).filter((log) => log.localDate !== localDate);
  writeMealLogs(updatedLogs, storage);
  return updatedLogs;
}

export function createDefaultMealLogInput(overrides: Partial<MealLogInput> = {}): MealLogInput {
  return {
    mealId: "chicken-rice",
    mealName: "Chicken Rice",
    carbonFootprintPerServing: 3.13,
    servings: MIN_SERVINGS,
    category: "Non Vegetarian",
    entryMethod: "manual",
    ...overrides,
  };
}
