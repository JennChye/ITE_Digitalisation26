import { describe, expect, it } from "vitest";
import type { MealLog } from "./mealHistoryService";
import { calculateAchievements, calculateMonthlyReflection, getFilteredRecommendations, readPositiveLearningState, recordRecommendationView, recordSwapActivity, recordMealDetailView, saveMonthlyReflectionNote, SINGAPORE_MEAL_IDS, SWAP_RECOMMENDATIONS, updateFoodPreferences } from "./positiveLearning";

function storage() { const values = new Map<string, string>(); return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) }; }
function log(id: string, mealId: string, options: Partial<MealLog> = {}): MealLog { return { id, mealId, mealName: mealId, carbonFootprintPerServing: 1, servings: 1, totalCarbonFootprint: 1, loggedAt: "2026-08-24T08:00:00.000Z", localDate: "2026-08-24", category: "Vegetarian", entryMethod: "manual", ...options }; }
function achievement(id: string, logs: MealLog[], state = readPositiveLearningState()) { return calculateAchievements(logs, state).find((item) => item.id === id)!; }

describe("positive private learning logic", () => {
  it("unlocks First Plate after one logged meal", () => {
    expect(achievement("first-plate", [log("1", "chicken-rice")]).earned).toBe(true);
  });

  it("unlocks Meal Explorer after five different meals", () => {
    const logs = ["a", "b", "c", "d", "e"].map((mealId, index) => log(String(index), mealId));
    expect(achievement("meal-explorer", logs).earned).toBe(true);
  });

  it("does not count the same repeatedly logged meal as five different meals", () => {
    const logs = Array.from({ length: 5 }, (_, index) => log(String(index), "chicken-rice"));
    const result = achievement("meal-explorer", logs);
    expect(result.earned).toBe(false);
    expect(result.progress).toBe(1);
  });

  it("unlocks Local Food Learner after viewing three Singapore meal details", () => {
    const target = storage();
    recordMealDetailView("chicken-rice", target); recordMealDetailView("laksa", target); recordMealDetailView("chicken-biryani", target);
    expect(achievement("local-food-learner", [], readPositiveLearningState(target)).earned).toBe(true);
  });

  it("unlocks Smart Swap Starter after viewing three recommendations", () => {
    const target = storage();
    SWAP_RECOMMENDATIONS.slice(0, 3).forEach((recommendation) => recordRecommendationView(recommendation.id, target));
    expect(achievement("smart-swap-starter", [], readPositiveLearningState(target)).earned).toBe(true);
  });

  it("does not display a made up carbon saving in a recommendation", () => {
    const recommendation = SWAP_RECOMMENDATIONS[0];
    expect(`${recommendation.explanation} ${recommendation.limitation}`).not.toMatch(/\d+\s*(kg|%|percent)/i);
    expect(recommendation.comparisonReady).toBe(false);
  });

  it("respects vegetarian and allergy preferences before showing swaps", () => {
    const target = storage();
    updateFoodPreferences({ vegetarianOnly: true, allergies: ["tofu"] }, target);
    const options = getFilteredRecommendations("chicken-rice", readPositiveLearningState(target).preferences);
    expect(options).toEqual([]);
  });

  it("withholds a swap when cultural suitability is not recorded", () => {
    const target = storage();
    updateFoodPreferences({ culturalPreferences: ["halal"] }, target);
    expect(getFilteredRecommendations("laksa", readPositiveLearningState(target).preferences)).toEqual([]);
  });

  it("offers two transparent local swap ideas for every supported Singapore meal", () => {
    SINGAPORE_MEAL_IDS.forEach((mealId) => {
      const localOptions = getFilteredRecommendations(mealId, readPositiveLearningState().preferences);
      expect(localOptions.length).toBeGreaterThanOrEqual(2);
      localOptions.forEach((option) => {
        expect(option.comparisonReady).toBe(false);
        expect(`${option.explanation} ${option.limitation}`).not.toMatch(/\d+\s*(kg|%|percent)/i);
      });
    });
  });

  it("records a tried swap without assuming the student logged it", () => {
    const target = storage();
    recordSwapActivity({ originalMealId: "laksa", originalMealName: "Laksa", suggestedOption: "Vegetable noodle soup", loggedNewMeal: false }, target);
    const activity = readPositiveLearningState(target).swapActivities[0];
    expect(activity.originalMealName).toBe("Laksa");
    expect(activity.loggedNewMeal).toBe(false);
  });

  it("unlocks Waste Wise when a meal note describes avoiding waste", () => {
    expect(achievement("waste-wise", [log("1", "chicken-rice", { note: "Shared leftovers to avoid food waste" })]).earned).toBe(true);
  });

  it("summarises only the selected month using private meals, swaps, and badges", () => {
    const target = storage();
    recordSwapActivity({ originalMealId: "laksa", originalMealName: "Laksa", suggestedOption: "Vegetable noodle soup", loggedNewMeal: false, date: "2026-08-12T09:00:00.000Z" }, target);
    const logs = [log("1", "chicken-rice", { localDate: "2026-08-02", totalCarbonFootprint: 3.13 }), log("2", "laksa", { localDate: "2026-08-12", totalCarbonFootprint: 6.53 }), log("3", "laksa", { localDate: "2026-09-01" })];
    expect(calculateMonthlyReflection(logs, readPositiveLearningState(target), "2026-08")).toMatchObject({ mealCount: 2, totalCarbonFootprint: 9.66, uniqueMealCount: 2, daysLogged: 2, triedSwapCount: 1, topMealName: "chicken-rice" });
  });

  it("keeps an optional monthly reflection note in private local learning storage", () => {
    const target = storage();
    saveMonthlyReflectionNote("2026-08", "  I enjoyed trying more vegetables.  ", target);
    expect(readPositiveLearningState(target).monthlyReflections[0]).toMatchObject({ month: "2026-08", note: "I enjoyed trying more vegetables." });
  });
});
