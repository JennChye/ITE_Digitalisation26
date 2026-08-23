import {
  EMPTY_HISTORY_MESSAGE,
  MEAL_HISTORY_STORAGE_KEY,
  addMealLog,
  calculateDailySummary,
  clearMealLogsForDate,
  createDefaultMealLogInput,
  deleteMealLog,
  getLogsForDate,
  readMealLogs,
  updateMealLogServings,
} from "./mealHistoryService";
import { formatCarbonFootprint } from "./mealFootprint";
import { beforeEach, describe, expect, it } from "vitest";

class MemoryStorage {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const firstDay = new Date(2026, 6, 10, 9, 0, 0);
const secondDay = new Date(2026, 6, 11, 9, 0, 0);

describe("meal history service", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it("logging one Chicken Rice meal creates one history record", () => {
    const log = addMealLog(createDefaultMealLogInput({ loggedAt: firstDay }), storage);
    const logs = readMealLogs(storage);

    expect(log.mealName).toBe("Chicken Rice");
    expect(logs).toHaveLength(1);
    expect(logs[0].totalCarbonFootprint).toBe(3.13);
  });

  it("creates 13.06 kg CO2e for two servings of Laksa", () => {
    const log = addMealLog(
      createDefaultMealLogInput({
        mealId: "laksa",
        mealName: "Laksa",
        carbonFootprintPerServing: 6.53,
        servings: 2,
        loggedAt: firstDay,
      }),
      storage,
    );

    expect(formatCarbonFootprint(log.totalCarbonFootprint)).toBe("13.06 kg CO2e");
  });

  it("adds several logs from the same date into the daily summary", () => {
    addMealLog(createDefaultMealLogInput({ loggedAt: firstDay }), storage);
    addMealLog(createDefaultMealLogInput({ mealId: "roti-prata", mealName: "Roti Prata", carbonFootprintPerServing: 0.5, category: "Vegetarian", loggedAt: firstDay }), storage);

    expect(calculateDailySummary(readMealLogs(storage), "2026-07-10")).toEqual({ mealCount: 2, totalCarbonFootprint: 3.63 });
  });

  it("does not include meals from another date in the selected day summary", () => {
    addMealLog(createDefaultMealLogInput({ loggedAt: firstDay }), storage);
    addMealLog(createDefaultMealLogInput({ loggedAt: secondDay }), storage);

    expect(calculateDailySummary(readMealLogs(storage), "2026-07-10")).toEqual({ mealCount: 1, totalCarbonFootprint: 3.13 });
  });

  it("updates the total footprint when servings are edited", () => {
    const log = addMealLog(createDefaultMealLogInput({ loggedAt: firstDay }), storage);
    const updatedLogs = updateMealLogServings(log.id, 3, storage);

    expect(updatedLogs[0]).toMatchObject({ servings: 3, totalCarbonFootprint: 9.39 });
  });

  it("deleting one record keeps other records", () => {
    const firstLog = addMealLog(createDefaultMealLogInput({ loggedAt: firstDay }), storage);
    const secondLog = addMealLog(createDefaultMealLogInput({ mealId: "laksa", mealName: "Laksa", carbonFootprintPerServing: 6.53, loggedAt: firstDay }), storage);
    const remainingLogs = deleteMealLog(firstLog.id, storage);

    expect(remainingLogs).toHaveLength(1);
    expect(remainingLogs[0].id).toBe(secondLog.id);
  });

  it("clearing one day keeps records from other days", () => {
    addMealLog(createDefaultMealLogInput({ loggedAt: firstDay }), storage);
    addMealLog(createDefaultMealLogInput({ loggedAt: secondDay }), storage);
    const remainingLogs = clearMealLogsForDate("2026-07-10", storage);

    expect(remainingLogs).toHaveLength(1);
    expect(getLogsForDate(remainingLogs, "2026-07-11")).toHaveLength(1);
  });

  it("provides a friendly empty history message", () => {
    expect(getLogsForDate(readMealLogs(storage), "2026-07-10")).toEqual([]);
    expect(EMPTY_HISTORY_MESSAGE).toContain("No meals logged yet");
  });

  it("returns an empty history when stored data is damaged", () => {
    storage.setItem(MEAL_HISTORY_STORAGE_KEY, "not valid json");

    expect(readMealLogs(storage)).toEqual([]);
  });
});
