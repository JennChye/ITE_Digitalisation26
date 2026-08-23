// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cloud: { foods: [] as Array<Record<string, unknown>>, publishedMealsLoading: true },
  navigate: vi.fn(),
}));

vi.mock("@/hooks/useCloudFoods", () => ({ useCloudFoods: () => mocks.cloud }));
vi.mock("@/hooks/useMealCloudSync", () => ({ useMealCloudSync: () => ({ syncLog: vi.fn() }) }));
vi.mock("@/components/BottomNavigation", () => ({ default: () => null }));
vi.mock("wouter", () => ({
  useLocation: () => ["/meal/thai-tom-yum-gong", mocks.navigate],
  useRoute: () => [true, { id: "thai-tom-yum-gong" }],
}));

import MealDetail from "./MealDetail";

describe("regional meal detail", () => {
  it("shows a loading state until the cloud regional record is available", () => {
    mocks.cloud = { foods: [], publishedMealsLoading: true };
    render(<MealDetail />);

    expect(screen.getByRole("status").textContent).toContain("Loading research meal");
  });

  it("shows the Pan Asian research explanation, source label, and source link", () => {
    mocks.cloud = {
      publishedMealsLoading: false,
      foods: [{
        id: "thai-tom-yum-gong",
        name: "Thai Tom Yum Gong Soup",
        carbonScore: 1.08,
        category: "Non Vegetarian",
        cardGradient: "linear-gradient(#dcebd4, #6d9e69)",
        factors: ["Country: Thailand", "Source record: 696"],
        estimateMethod: "Regional research dataset",
        sourceLabel: "Pan Asian Dish Carbon Dataset, Thailand record 696",
        sourceUrl: "https://doi.org/10.6084/m9.figshare.25999843.v3",
      }],
    };
    render(<MealDetail />);

    expect(screen.getByText(/Pan Asian dish research dataset/i)).toBeTruthy();
    expect(screen.getByText("Pan Asian Dish Carbon Dataset, Thailand record 696")).toBeTruthy();
    expect(screen.getByRole("link", { name: /view data source/i }).getAttribute("href")).toBe("https://doi.org/10.6084/m9.figshare.25999843.v3");
  });
});
