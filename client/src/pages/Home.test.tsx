// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cloudFoods: [] as Array<Record<string, unknown>>,
  navigate: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false, logout: vi.fn() }) }));
vi.mock("@/hooks/useCloudFoods", () => ({ useCloudFoods: () => ({ foods: mocks.cloudFoods, publishedMealsLoading: false }) }));
vi.mock("@/components/BottomNavigation", () => ({ default: () => null }));
vi.mock("@/components/TopMealsDashboard", () => ({ TopMealsDashboard: () => null }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: { mealHistory: { topFive: { useQuery: () => ({ data: [], isLoading: false }) } } } }));
vi.mock("wouter", () => ({ useLocation: () => ["/", mocks.navigate] }));

import { foods } from "@/lib/foodDatabase";
import Home from "./Home";

describe("main page session meals", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    mocks.cloudFoods = foods.slice(0, 6);
    vi.spyOn(Math, "random").mockReturnValue(0.37);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders exactly three selected meal cards and the database total badge", async () => {
    render(<Home />);

    await waitFor(() => expect(screen.getAllByTestId("session-meal-card")).toHaveLength(3));
    expect(screen.getByText("3 of 6 meals")).toBeTruthy();
  });

  it("keeps the same three selected meals when the main page mounts again in one session", async () => {
    const first = render(<Home />);
    await waitFor(() => expect(screen.getAllByTestId("session-meal-card")).toHaveLength(3));
    const firstCards = screen.getAllByTestId("session-meal-card").map((card) => card.textContent);
    first.unmount();

    render(<Home />);
    await waitFor(() => expect(screen.getAllByTestId("session-meal-card")).toHaveLength(3));
    const secondCards = screen.getAllByTestId("session-meal-card").map((card) => card.textContent);
    expect(secondCards).toEqual(firstCards);
  });
});
