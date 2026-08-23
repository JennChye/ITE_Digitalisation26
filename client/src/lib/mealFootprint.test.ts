import { getFoodById, MEAL_NOT_FOUND_MESSAGE } from "./foodDatabase";
import {
  calculateTotalCarbonFootprint,
  formatCarbonFootprint,
  getFootprintBand,
  normaliseServings,
} from "./mealFootprint";
import { describe, expect, it } from "vitest";

describe("meal footprint calculations", () => {
  it("shows Chicken Rice as 3.13 kg CO2e for one serving", () => {
    const chickenRice = getFoodById("chicken-rice");
    const total = calculateTotalCarbonFootprint(chickenRice!.carbonScore, 1);

    expect(formatCarbonFootprint(total)).toBe("3.13 kg CO2e");
  });

  it("shows two servings of Laksa as 13.06 kg CO2e", () => {
    const laksa = getFoodById("laksa");
    const total = calculateTotalCarbonFootprint(laksa!.carbonScore, 2);

    expect(formatCarbonFootprint(total)).toBe("13.06 kg CO2e");
  });

  it("does not allow a serving number below one", () => {
    expect(normaliseServings(0)).toBe(1);
    expect(normaliseServings(-3)).toBe(1);
  });

  it("uses the correct progress bar colour category", () => {
    expect(getFootprintBand(0.5)).toMatchObject({ label: "Lower estimate", colorClass: "bg-[#4b915d]" });
    expect(getFootprintBand(3.13)).toMatchObject({ label: "Medium estimate", colorClass: "bg-[#d39a25]" });
    expect(getFootprintBand(6.53)).toMatchObject({ label: "Higher estimate", colorClass: "bg-[#d56540]" });
  });

  it("handles a missing food item with friendly fallback content", () => {
    expect(getFoodById("missing-food")).toBeUndefined();
    expect(MEAL_NOT_FOUND_MESSAGE).toContain("could not find this meal");
  });
});
