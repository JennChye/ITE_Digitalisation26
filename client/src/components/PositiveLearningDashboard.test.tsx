// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PositiveLearningDashboard from "./PositiveLearningDashboard";

describe("Positive Learning Dashboard", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it("hides private badges when badges are turned off without affecting the meal feature", () => {
    render(<PositiveLearningDashboard />);
    expect(screen.getByRole("heading", { name: "Achievements" })).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Turn learning badges on" }));
    expect(screen.queryByRole("heading", { name: "Achievements" })).toBeNull();
    expect(screen.getByText(/sustainable swaps/i)).toBeTruthy();
  });

  it("opens the private badge collection from the dashboard", () => {
    const openCollection = vi.fn();
    render(<PositiveLearningDashboard onOpenCollection={openCollection} />);
    fireEvent.click(screen.getByRole("button", { name: "View my badge collection" }));
    expect(openCollection).toHaveBeenCalledTimes(1);
  });
});
