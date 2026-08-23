import { CUSTOM_MEAL_NOTICE, createCustomMealId, createCustomMealSuggestion, estimateCustomMeal, validateCustomMealInput } from "./customMealEstimator";
import { describe, expect, it } from "vitest";

describe("Custom Meal Estimator", () => {
  it("calculates a vegetarian rice bowl from selected components", () => {
    const estimate = estimateCustomMeal({
      mealName: "Tofu Rice Bowl",
      proteinId: "tofu",
      baseId: "rice",
      cookingMethodId: "boiled",
      includesVegetables: true,
      includesCoconutOrDairy: false,
      proteinAmountGrams: 150,
      baseAmountGrams: 200,
      vegetableAmountGrams: 100,
      coconutOrDairyAmountGrams: 100,
      servings: 2,
    });

    expect(estimate).toEqual({
      carbonPerServing: 1.11,
      totalCarbonFootprint: 2.22,
      category: "Vegetarian",
      factors: ["Tofu or beans 150 g", "Rice 200 g", "Boiled or steamed", "Vegetables 100 g"],
      contributions: [
        { label: "Tofu or beans 150 g", carbonPerServing: 0.45, percentage: 40.5 },
        { label: "Rice 200 g", carbonPerServing: 0.46, percentage: 41.4 },
        { label: "Boiled or steamed", carbonPerServing: 0.1, percentage: 9 },
        { label: "Vegetables 100 g", carbonPerServing: 0.1, percentage: 9 },
      ],
    });
  });

  it("calculates a higher impact beef meal with coconut and slow cooking", () => {
    const estimate = estimateCustomMeal({
      mealName: "Beef Coconut Noodles",
      proteinId: "beef",
      baseId: "noodles",
      cookingMethodId: "slow-cooked",
      includesVegetables: true,
      includesCoconutOrDairy: true,
      proteinAmountGrams: 100,
      baseAmountGrams: 180,
      vegetableAmountGrams: 80,
      coconutOrDairyAmountGrams: 100,
      servings: 2,
    });

    expect(estimate.carbonPerServing).toBe(3.67);
    expect(estimate.totalCarbonFootprint).toBe(7.34);
    expect(estimate.category).toBe("Non Vegetarian");
    expect(estimate.contributions.reduce((total, contribution) => total + contribution.carbonPerServing, 0)).toBe(3.67);
    expect(estimate.contributions.reduce((total, contribution) => total + contribution.percentage, 0)).toBe(100);
  });

  it("suggests editable ingredient settings from an unsupported meal name or visible ingredients", () => {
    const prawnCurryMee = createCustomMealSuggestion("Prawn curry mee", ["prawns", "coconut milk", "noodles"]);
    const lambRice = createCustomMealSuggestion("Mutton rice", ["lamb", "rice"]);

    expect(prawnCurryMee).toMatchObject({ proteinId: "prawns", baseId: "noodles", cookingMethodId: "slow-cooked", includesCoconutOrDairy: true });
    expect(lambRice).toMatchObject({ proteinId: "lamb", baseId: "rice" });
  });

  it("rejects missing meal names and invalid servings", () => {
    expect(validateCustomMealInput({ servings: 1 })).toBe("Please enter a name for your meal.");
    expect(validateCustomMealInput({ mealName: "Test", proteinId: "tofu", baseId: "rice", cookingMethodId: "boiled", proteinAmountGrams: 0, baseAmountGrams: 100, vegetableAmountGrams: 100, coconutOrDairyAmountGrams: 100, servings: 1 })).toContain("Protein amount");
  });

  it("creates safe ids and clearly labels the result as a prototype", () => {
    expect(createCustomMealId("My New Meal!")).toBe("custom-my-new-meal");
    expect(CUSTOM_MEAL_NOTICE).toContain("custom prototype estimate");
  });
});
