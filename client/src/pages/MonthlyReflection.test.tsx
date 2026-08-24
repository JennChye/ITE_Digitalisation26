// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addMealLog } from "@/lib/mealHistoryService";
import { readPositiveLearningState, updatePositiveLearningSettings } from "@/lib/positiveLearning";

const navigate = vi.fn();
vi.mock("@/components/BottomNavigation", () => ({ default: () => null }));
vi.mock("wouter", () => ({ useLocation: () => ["/reflection", navigate] }));

import MonthlyReflection from "./MonthlyReflection";

describe("Monthly Reflection", () => {
  beforeEach(() => { window.localStorage.clear(); navigate.mockReset(); });
  afterEach(() => cleanup());

  it("shows private monthly meal and badge reflection without sharing controls", () => {
    addMealLog({ mealId: "chicken-rice", mealName: "Chicken Rice", carbonFootprintPerServing: 3.13, servings: 1, category: "Non Vegetarian" });
    render(<MonthlyReflection />);
    expect(screen.getByRole("heading", { name: "Monthly reflection" })).toBeTruthy();
    expect(screen.getByText(/never added to Student Community/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /share/i })).toBeNull();
  });

  it("saves an optional private reflection note for the selected month", () => {
    render(<MonthlyReflection />);
    fireEvent.change(screen.getByLabelText("Private monthly reflection note"), { target: { value: "I enjoyed trying a vegetable option." } });
    fireEvent.click(screen.getByRole("button", { name: "Save reflection" }));
    expect(screen.getByRole("status").textContent).toMatch(/saved on this device/i);
    expect(readPositiveLearningState().monthlyReflections[0]?.note).toBe("I enjoyed trying a vegetable option.");
  });

  it("shows a clear paused state when reflection is optional and turned off", () => {
    updatePositiveLearningSettings({ monthlyReflectionEnabled: false });
    render(<MonthlyReflection />);
    expect(screen.getByRole("heading", { name: "Reflection is paused" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open dashboard controls" })).toBeTruthy();
  });
});
