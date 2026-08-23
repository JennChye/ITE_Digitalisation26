import { describe, expect, it } from "vitest";
import { parseFlexibleEstimateSearch } from "./CustomMealEstimator";
import { buildFlexibleEstimatePath } from "./LogMeal";

describe("flexible estimate recovery", () => {
  it("carries an unsupported manual meal name into a prefilled flexible estimate", () => {
    const path = buildFlexibleEstimatePath("Mutton rice");
    const suggestion = parseFlexibleEstimateSearch(path.split("?")[1] ?? "");

    expect(path).toBe("/custom-estimate?meal=Mutton+rice");
    expect(suggestion).toMatchObject({ mealName: "Mutton rice", proteinId: "lamb", baseId: "rice" });
  });

  it("carries an unclear photo candidate and visible ingredients into a flexible estimate", () => {
    const path = buildFlexibleEstimatePath("Prawn curry mee", ["prawns", "coconut milk", "noodles"]);
    const suggestion = parseFlexibleEstimateSearch(path.split("?")[1] ?? "");

    expect(suggestion).toMatchObject({ mealName: "Prawn curry mee", proteinId: "prawns", baseId: "noodles", cookingMethodId: "slow-cooked", includesCoconutOrDairy: true });
  });
});
