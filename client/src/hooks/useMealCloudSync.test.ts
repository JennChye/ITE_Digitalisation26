import { describe, expect, it } from "vitest";
import type { MealLog } from "@/lib/mealHistoryService";
import { resolveHistoryLogs, shouldStartLocalImport, toCloudLog } from "./useMealCloudSync";

const localLog: MealLog = {
  id: "local-1",
  mealId: "chicken-rice",
  mealName: "Chicken Rice",
  carbonFootprintPerServing: 3.13,
  servings: 2,
  totalCarbonFootprint: 6.26,
  loggedAt: "2026-08-23T09:00:00.000Z",
  localDate: "2026-08-23",
  category: "Non Vegetarian",
  entryMethod: "manual",
  location: "ITE canteen",
};

describe("meal cloud sync decisions", () => {
  it("imports a local record once after a user signs in", () => {
    expect(shouldStartLocalImport(false, false, false)).toBe(false);
    expect(shouldStartLocalImport(true, false, false)).toBe(true);
    expect(shouldStartLocalImport(true, true, false)).toBe(false);
    expect(toCloudLog(localLog)).toMatchObject({ clientLogId: "local-1", carbonHundredths: 313, servings: 2, locationText: "ITE canteen" });
  });

  it("uses cloud history after sign in and local history while signed out", () => {
    const cloudRecord = { ...toCloudLog(localLog), id: 19 };

    expect(resolveHistoryLogs(false, [localLog], [cloudRecord])).toEqual([localLog]);
    expect(resolveHistoryLogs(true, [localLog], [cloudRecord])).toEqual([
      expect.objectContaining({ id: "19", mealName: "Chicken Rice", totalCarbonFootprint: 6.26, location: "ITE canteen" }),
    ]);
  });
});
