import { describe, expect, it } from "vitest";
import { foods } from "./foodDatabase";
import { SESSION_MEAL_IDS_KEY, chooseSessionMeals, getSessionMealIds } from "./sessionMealPicker";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("session meal picker", () => {
  it("selects three unique dishes without changing the original database order", () => {
    const picks = chooseSessionMeals(foods, 3, () => 0.25);

    expect(picks).toHaveLength(3);
    expect(new Set(picks.map((food) => food.id)).size).toBe(3);
    expect(foods[0].id).toBe("chicken-rice");
  });

  it("reuses the same three valid dish ids during a browser session", () => {
    const storage = createStorage();
    const first = getSessionMealIds(foods, storage, () => 0.75);
    const second = getSessionMealIds(foods, storage, () => 0.01);

    expect(first).toHaveLength(3);
    expect(second).toEqual(first);
    expect(JSON.parse(storage.getItem(SESSION_MEAL_IDS_KEY) ?? "[]")).toEqual(first);
  });

  it("replaces stale session ids with available database dishes", () => {
    const storage = createStorage();
    storage.setItem(SESSION_MEAL_IDS_KEY, JSON.stringify(["missing", "laksa", "chicken-rice"]));

    const selected = getSessionMealIds(foods, storage, () => 0.4);
    expect(selected).toHaveLength(3);
    expect(selected.every((id) => foods.some((food) => food.id === id))).toBe(true);
  });
});
