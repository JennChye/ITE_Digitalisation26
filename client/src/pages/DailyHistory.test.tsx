// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addMealLog } from "@/lib/mealHistoryService";
import { readFavoriteMealPlaces } from "@/lib/favoriteMealPlaces";

vi.mock("@/components/BottomNavigation", () => ({ default: () => null }));
vi.mock("@/hooks/useMealCloudSync", () => ({ useMealCloudSync: () => ({ isAuthenticated: false, logs: [], historyLoading: false, updateCloudServings: vi.fn(), updateCloudLocation: vi.fn(), deleteCloudLog: vi.fn(), clearCloudDate: vi.fn() }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/history", vi.fn()] }));

import DailyHistory from "./DailyHistory";

describe("Daily History favourite places", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it("lets a student save a recorded private meal place as a favourite", () => {
    addMealLog({ mealId: "chicken-rice", mealName: "Chicken Rice", carbonFootprintPerServing: 3.13, servings: 1, category: "Non Vegetarian", location: "Home" });
    render(<DailyHistory />);
    fireEvent.click(screen.getByRole("button", { name: "Save as favourite place" }));

    expect(readFavoriteMealPlaces()).toMatchObject([{ label: "Home" }]);
    expect(screen.getByText("Private favourite meal places")).toBeTruthy();
  });
});
