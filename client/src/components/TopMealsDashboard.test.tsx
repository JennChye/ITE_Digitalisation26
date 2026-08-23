// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { TopMealsDashboard } from "./TopMealsDashboard";

describe("TopMealsDashboard", () => {
  it("asks a signed out visitor to sign in before showing personal meal patterns", () => {
    const onSignIn = vi.fn();
    render(<TopMealsDashboard isAuthenticated={false} isLoading={false} topMeals={[]} onLogMeal={vi.fn()} onSignIn={onSignIn} />);

    expect(screen.getByText(/summary stays private to your account/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /sign in to view your meals/i }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("shows a signed in user ranked meal frequency and uses only supplied personal results", () => {
    render(<TopMealsDashboard isAuthenticated isLoading={false} onLogMeal={vi.fn()} onSignIn={vi.fn()} topMeals={[
      { mealSlug: "laksa", mealName: "Laksa", category: "Non Vegetarian", timesLogged: 3, totalServings: 4, lastLoggedAt: new Date("2026-08-23T12:00:00.000Z") },
      { mealSlug: "tofu-bowl", mealName: "Tofu Bowl", category: "Vegetarian", timesLogged: 1, totalServings: 1, lastLoggedAt: new Date("2026-08-22T12:00:00.000Z") },
    ]} />);

    expect(screen.getByText("Laksa")).toBeTruthy();
    expect(screen.getByText("3 logs")).toBeTruthy();
    expect(screen.getByLabelText("Rank 1")).toBeTruthy();
    expect(screen.getByLabelText("Laksa was logged 3 times").getAttribute("aria-valuenow")).toBe("3");
  });

  it("guides a signed in user with no meal logs to add their first meal", () => {
    const onLogMeal = vi.fn();
    render(<TopMealsDashboard isAuthenticated isLoading={false} topMeals={[]} onLogMeal={onLogMeal} onSignIn={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /log a meal/i }));
    expect(onLogMeal).toHaveBeenCalledTimes(1);
  });
});
