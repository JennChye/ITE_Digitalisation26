// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readMealLogs } from "@/lib/mealHistoryService";
import { updatePositiveLearningSettings } from "@/lib/positiveLearning";

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), syncLog: vi.fn() }));
vi.mock("@/hooks/useCloudFoods", () => ({ useCloudFoods: () => ({ publishedMealsLoading: false, foods: [{ id: "chicken-rice", name: "Chicken Rice", carbonScore: 3.13, category: "Non Vegetarian", factors: ["Poultry farming"], estimateMethod: "Published meal research" }] }) }));
vi.mock("@/hooks/useMealCloudSync", () => ({ useMealCloudSync: () => ({ syncLog: mocks.syncLog }) }));
vi.mock("@/components/BottomNavigation", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("wouter", () => ({ useLocation: () => ["/meal/chicken-rice", mocks.navigate], useRoute: () => [true, { id: "chicken-rice" }] }));

import MealDetail from "./MealDetail";

describe("Meal Detail positive learning feature switches", () => {
  beforeEach(() => { window.localStorage.clear(); mocks.syncLog.mockReset(); });
  afterEach(() => cleanup());

  it("keeps meal logging available when badges are disabled", () => {
    updatePositiveLearningSettings({ badgesEnabled: false });
    render(<MealDetail />);
    fireEvent.click(screen.getByRole("button", { name: "Log This Meal" }));
    expect(readMealLogs()).toHaveLength(1);
    expect(mocks.syncLog).toHaveBeenCalledTimes(1);
  });

  it("keeps the meal detail page working when sustainable swaps are disabled", () => {
    updatePositiveLearningSettings({ recommendationsEnabled: false });
    render(<MealDetail />);
    expect(screen.getByRole("heading", { name: "Chicken Rice" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Sustainable Food Swaps" })).toBeNull();
    expect(screen.getByRole("button", { name: "Log This Meal" })).toBeTruthy();
  });
});
