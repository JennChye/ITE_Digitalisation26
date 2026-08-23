import { foods } from "./foodDatabase";
import { addMealLog, readMealLogs } from "./mealHistoryService";
import {
  MEAL_ENTRY_OPTIONS,
  PHOTO_CAPTURE_NEXT_MODE,
  UNCLEAR_PHOTO_ACTIONS,
  UNCLEAR_PHOTO_MESSAGE,
  findSupportedFood,
  getPrototypeRecognition,
  searchSupportedFoods,
  validateEntryServings,
} from "./mealEntryUtils";
import { calculateTotalCarbonFootprint, formatCarbonFootprint } from "./mealFootprint";
import { describe, expect, it } from "vitest";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

describe("meal entry utilities", () => {
  it("provides camera and manual entry options", () => {
    expect(MEAL_ENTRY_OPTIONS).toEqual(["Take a Photo", "Enter Manually"]);
  });

  it("moves a captured photo to a scan before any meal is saved", () => {
    const storage = new MemoryStorage();
    expect(PHOTO_CAPTURE_NEXT_MODE).toBe("scanning");
    expect(readMealLogs(storage)).toEqual([]);
  });

  it("recognises Chicken Rice and allows the selected meal to be corrected", () => {
    const recognition = getPrototypeRecognition("Chicken Rice");
    const correctedFood = foods.find((food) => food.id === "laksa");

    expect(recognition).toMatchObject({ kind: "match", food: { id: "chicken-rice" } });
    expect(correctedFood?.name).toBe("Laksa");
  });

  it("sends unclear photos to the manual entry fallback message", () => {
    expect(getPrototypeRecognition("blurred meal")).toEqual({ kind: "unclear", message: UNCLEAR_PHOTO_MESSAGE });
    expect(UNCLEAR_PHOTO_ACTIONS).toEqual(["Retake photo", "Enter manually"]);
  });

  it("calculates supported manual entry totals", () => {
    const chickenRice = findSupportedFood("Chicken Rice")!;
    const laksa = findSupportedFood("Laksa")!;

    expect(formatCarbonFootprint(calculateTotalCarbonFootprint(chickenRice.carbonScore, 1))).toBe("3.13 kg CO2e");
    expect(formatCarbonFootprint(calculateTotalCarbonFootprint(laksa.carbonScore, 2))).toBe("13.06 kg CO2e");
  });

  it("finds supported dishes from the manual entry search", () => {
    expect(searchSupportedFoods("lak")).toMatchObject([{ id: "laksa", name: "Laksa" }]);
    expect(searchSupportedFoods("vegetarian").map((food) => food.id)).toEqual(["roti-prata", "vegetarian-bee-hoon"]);
    expect(searchSupportedFoods("unknown meal")).toEqual([]);
  });

  it("rejects invalid serving values", () => {
    expect(validateEntryServings(0)).toContain("whole number");
    expect(validateEntryServings(21)).toContain("whole number");
    expect(validateEntryServings(1.5)).toContain("whole number");
    expect(validateEntryServings(2)).toBeNull();
  });

  it("saves a camera meal record without storing a photo", () => {
    const storage = new MemoryStorage();
    const chickenRice = findSupportedFood("Chicken Rice")!;
    addMealLog({ mealId: chickenRice.id, mealName: chickenRice.name, carbonFootprintPerServing: chickenRice.carbonScore, servings: 1, category: chickenRice.category, entryMethod: "camera" }, storage);
    const storedJson = storage.getItem("platefootprint-meal-history-v1") ?? "";

    expect(readMealLogs(storage)[0]).toMatchObject({ mealName: "Chicken Rice", entryMethod: "camera", totalCarbonFootprint: 3.13 });
    expect(storedJson).not.toContain("photo");
  });
});
