// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PositiveLearningDashboard from "./PositiveLearningDashboard";

describe("Positive Learning Dashboard", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it("keeps achievement cards off Dashboard and hides the collection entry when badges are turned off", () => {
    render(<PositiveLearningDashboard />);
    expect(screen.queryByRole("heading", { name: "Achievements" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Your badge collection" })).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Turn learning badges on" }));
    expect(screen.queryByRole("heading", { name: "Your badge collection" })).toBeNull();
    expect(screen.getByText(/sustainable swaps/i)).toBeTruthy();
  });

  it("opens the private badge collection from the dashboard", () => {
    const openCollection = vi.fn();
    render(<PositiveLearningDashboard onOpenCollection={openCollection} />);
    fireEvent.click(screen.getByRole("button", { name: "Open badge collection" }));
    expect(openCollection).toHaveBeenCalledTimes(1);
  });

  it("opens the optional private monthly reflection from the dashboard", () => {
    const openReflection = vi.fn();
    render(<PositiveLearningDashboard onOpenReflection={openReflection} />);
    fireEvent.click(screen.getByRole("button", { name: "Open monthly reflection" }));
    expect(openReflection).toHaveBeenCalledTimes(1);
  });
});
