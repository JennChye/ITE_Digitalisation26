import { describe, expect, it } from "vitest";
import { summariseUserTopMeals } from "./db";

describe("user top meals summary", () => {
  it("counts meal logs, totals servings, sorts by frequency, and limits to five meals", () => {
    const logs = [
      { mealSlug: "laksa", mealName: "Laksa", category: "Non Vegetarian" as const, servings: 1, loggedAt: new Date("2026-08-22T09:00:00.000Z") },
      { mealSlug: "chicken-rice", mealName: "Chicken Rice", category: "Non Vegetarian" as const, servings: 2, loggedAt: new Date("2026-08-23T09:00:00.000Z") },
      { mealSlug: "laksa", mealName: "Laksa", category: "Non Vegetarian" as const, servings: 2, loggedAt: new Date("2026-08-23T12:00:00.000Z") },
      { mealSlug: "beef-noodles", mealName: "Beef Noodles", category: "Non Vegetarian" as const, servings: 1, loggedAt: new Date("2026-08-23T10:00:00.000Z") },
      { mealSlug: "tofu-bowl", mealName: "Tofu Bowl", category: "Vegetarian" as const, servings: 1, loggedAt: new Date("2026-08-23T10:00:00.000Z") },
      { mealSlug: "nasi-lemak", mealName: "Nasi Lemak", category: "Non Vegetarian" as const, servings: 1, loggedAt: new Date("2026-08-23T10:00:00.000Z") },
      { mealSlug: "roti-prata", mealName: "Roti Prata", category: "Vegetarian" as const, servings: 1, loggedAt: new Date("2026-08-23T10:00:00.000Z") },
    ];

    expect(summariseUserTopMeals(logs)).toEqual([
      { mealSlug: "laksa", mealName: "Laksa", category: "Non Vegetarian", timesLogged: 2, totalServings: 3, lastLoggedAt: new Date("2026-08-23T12:00:00.000Z") },
      { mealSlug: "chicken-rice", mealName: "Chicken Rice", category: "Non Vegetarian", timesLogged: 1, totalServings: 2, lastLoggedAt: new Date("2026-08-23T09:00:00.000Z") },
      { mealSlug: "beef-noodles", mealName: "Beef Noodles", category: "Non Vegetarian", timesLogged: 1, totalServings: 1, lastLoggedAt: new Date("2026-08-23T10:00:00.000Z") },
      { mealSlug: "nasi-lemak", mealName: "Nasi Lemak", category: "Non Vegetarian", timesLogged: 1, totalServings: 1, lastLoggedAt: new Date("2026-08-23T10:00:00.000Z") },
      { mealSlug: "roti-prata", mealName: "Roti Prata", category: "Vegetarian", timesLogged: 1, totalServings: 1, lastLoggedAt: new Date("2026-08-23T10:00:00.000Z") },
    ]);
  });

  it("returns no top meals when the user has not logged a meal", () => {
    expect(summariseUserTopMeals([])).toEqual([]);
  });
});
