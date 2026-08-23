// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MEAL_HISTORY_STORAGE_KEY, MealLog } from "@/lib/mealHistoryService";
import type { CloudLog } from "./useMealCloudSync";

const state = vi.hoisted(() => ({
  authenticated: false,
  cloudLogs: [] as CloudLog[],
  importMutate: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: state.authenticated ? { id: 7, name: "Student" } : null,
    loading: false,
    error: null,
    isAuthenticated: state.authenticated,
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/trpc", () => {
  const idleMutation = { mutate: vi.fn(), isPending: false };
  return {
    trpc: {
      useUtils: () => ({ mealHistory: { list: { invalidate: state.invalidate } } }),
      mealHistory: {
        list: { useQuery: () => ({ data: state.authenticated ? state.cloudLogs : undefined, isLoading: false, error: null }) },
        upsert: { useMutation: () => idleMutation },
        import: { useMutation: () => ({ mutate: state.importMutate, isPending: false }) },
        updateServings: { useMutation: () => idleMutation },
        delete: { useMutation: () => idleMutation },
        clearDate: { useMutation: () => idleMutation },
      },
    },
  };
});

import { useMealCloudSync } from "./useMealCloudSync";

const localLog: MealLog = {
  id: "device-log-1",
  mealId: "chicken-rice",
  mealName: "Chicken Rice",
  carbonFootprintPerServing: 3.13,
  servings: 1,
  totalCarbonFootprint: 3.13,
  loggedAt: "2026-08-23T09:00:00.000Z",
  localDate: "2026-08-23",
  category: "Non Vegetarian",
  entryMethod: "manual",
};

describe("useMealCloudSync integration", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(MEAL_HISTORY_STORAGE_KEY, JSON.stringify([localLog]));
    state.authenticated = false;
    state.cloudLogs = [];
    state.importMutate.mockReset();
  });

  it("keeps local history while signed out, imports once after sign in, and reloads cloud history", async () => {
    const { result, rerender } = renderHook(() => useMealCloudSync());

    expect(result.current.logs).toEqual([localLog]);

    state.cloudLogs = [{
      id: 44,
      clientLogId: localLog.id,
      mealSlug: localLog.mealId,
      mealName: localLog.mealName,
      carbonHundredths: 313,
      servings: 2,
      category: "Non Vegetarian",
      entryMethod: "manual",
      localDate: localLog.localDate,
      loggedAt: new Date(localLog.loggedAt),
    }];
    state.authenticated = true;
    rerender();

    await waitFor(() => expect(state.importMutate).toHaveBeenCalledTimes(1));
    expect(state.importMutate).toHaveBeenCalledWith([expect.objectContaining({ clientLogId: "device-log-1", carbonHundredths: 313 })]);
    expect(result.current.logs).toEqual([expect.objectContaining({ id: "44", servings: 2, totalCarbonFootprint: 6.26 })]);

    act(() => rerender());
    expect(state.importMutate).toHaveBeenCalledTimes(1);
  });
});
