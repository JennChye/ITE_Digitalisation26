// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addMealLog } from "@/lib/mealHistoryService";
import { updatePositiveLearningSettings } from "@/lib/positiveLearning";

const navigate = vi.fn();
vi.mock("@/components/BottomNavigation", () => ({ default: () => null }));
vi.mock("wouter", () => ({ useLocation: () => ["/badges", navigate] }));

import BadgeCollection from "./BadgeCollection";

describe("Badge Collection", () => {
  beforeEach(() => { window.localStorage.clear(); navigate.mockReset(); });
  afterEach(() => cleanup());

  it("shows earned private badges without community sharing controls", () => {
    addMealLog({ mealId: "chicken-rice", mealName: "Chicken Rice", carbonFootprintPerServing: 3.13, servings: 1, category: "Non Vegetarian" });
    render(<BadgeCollection />);
    expect(screen.getByRole("heading", { name: "Your learning badges" })).toBeTruthy();
    expect(screen.getByText("First Plate")).toBeTruthy();
    expect(screen.getByText(/not shared with Student Community/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /share/i })).toBeNull();
  });

  it("shows a clear paused state when badges are disabled", () => {
    updatePositiveLearningSettings({ badgesEnabled: false });
    render(<BadgeCollection />);
    expect(screen.getByRole("heading", { name: "Badges are paused" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open dashboard controls" })).toBeTruthy();
  });
});
