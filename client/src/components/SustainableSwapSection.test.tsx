// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Food } from "@/lib/foodDatabase";
import { readPositiveLearningState, updatePositiveLearningSettings } from "@/lib/positiveLearning";
import SustainableSwapSection from "./SustainableSwapSection";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
const chickenRice: Food = { id: "chicken-rice", name: "Chicken Rice", carbonScore: 3.13, category: "Non Vegetarian", factors: [], estimateMethod: "Published meal research" };

describe("Sustainable Swap Section", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it("does not claim a viewed recommendation was completed", () => {
    render(<SustainableSwapSection food={chickenRice} />);
    expect(screen.getAllByText((_, element) => element?.textContent === "Starting from: Chicken Rice")).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "View this option" })[0]);
    expect(screen.getByText(/viewing this idea does not mean you completed the swap/i)).toBeTruthy();
    expect(readPositiveLearningState().swapActivities).toHaveLength(0);
  });

  it("records a tried option and respects disabled recommendations", () => {
    const rendered = render(<SustainableSwapSection food={chickenRice} />);
    fireEvent.click(screen.getAllByRole("button", { name: "View this option" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "I tried this option" }));
    expect(readPositiveLearningState().swapActivities).toHaveLength(1);
    rendered.unmount();
    updatePositiveLearningSettings({ recommendationsEnabled: false });
    render(<SustainableSwapSection food={chickenRice} />);
    expect(screen.queryByRole("heading", { name: "Sustainable Food Swaps" })).toBeNull();
  });
});
