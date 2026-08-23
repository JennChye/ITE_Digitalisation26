import type { Food } from "./foodDatabase";

export const SESSION_MEAL_COUNT = 3;
export const SESSION_MEAL_IDS_KEY = "platefootprint.sessionMealIds.v1";

type SessionStorageLike = Pick<Storage, "getItem" | "setItem">;

export function chooseSessionMeals<T>(items: T[], count = SESSION_MEAL_COUNT, random = Math.random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const selectedIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[selectedIndex]] = [shuffled[selectedIndex], shuffled[index]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function readStoredIds(storage: SessionStorageLike, availableIds: Set<string>, count: number): string[] | null {
  try {
    const stored = JSON.parse(storage.getItem(SESSION_MEAL_IDS_KEY) ?? "[]");
    if (!Array.isArray(stored) || stored.length !== count || stored.some((id) => typeof id !== "string" || !availableIds.has(id))) return null;
    return stored;
  } catch {
    return null;
  }
}

export function getSessionMealIds(foods: Food[], storage: SessionStorageLike, random = Math.random): string[] {
  const count = Math.min(SESSION_MEAL_COUNT, foods.length);
  const availableIds = new Set(foods.map((food) => food.id));
  const storedIds = readStoredIds(storage, availableIds, count);
  if (storedIds) return storedIds;

  const selectedIds = chooseSessionMeals(foods, count, random).map((food) => food.id);
  storage.setItem(SESSION_MEAL_IDS_KEY, JSON.stringify(selectedIds));
  return selectedIds;
}
