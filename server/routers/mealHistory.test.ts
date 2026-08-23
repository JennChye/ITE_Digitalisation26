import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const dbMock = vi.hoisted(() => ({
  clearUserMealLogsForDate: vi.fn(),
  deleteUserMealLog: vi.fn(),
  listUserMealLogs: vi.fn(),
  updateUserMealLogServings: vi.fn(),
  upsertUserMealLog: vi.fn(),
}));

vi.mock("../db", () => dbMock);

import { mealHistoryRouter } from "./mealHistory";

function contextForUser(id: number | null): TrpcContext {
  return {
    user: id === null ? null : {
      id,
      openId: `user-${id}`,
      name: "Student",
      email: null,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("mealHistory cloud access", () => {
  it("lists only records for the authenticated user", async () => {
    dbMock.listUserMealLogs.mockResolvedValue([]);
    const caller = mealHistoryRouter.createCaller(contextForUser(17));

    await caller.list();

    expect(dbMock.listUserMealLogs).toHaveBeenCalledWith(17);
  });

  it("keeps the authenticated user id when saving a cloud meal", async () => {
    dbMock.upsertUserMealLog.mockResolvedValue(undefined);
    const caller = mealHistoryRouter.createCaller(contextForUser(23));

    await caller.upsert({
      clientLogId: "local-1",
      mealSlug: "chicken-rice",
      mealName: "Chicken Rice",
      carbonHundredths: 313,
      servings: 1,
      category: "Non Vegetarian",
      entryMethod: "manual",
      localDate: "2026-08-23",
      loggedAt: new Date("2026-08-23T08:00:00.000Z"),
    });

    expect(dbMock.upsertUserMealLog).toHaveBeenCalledWith(23, expect.objectContaining({ mealName: "Chicken Rice" }));
  });

  it("imports local records using the signed in user id for a new session", async () => {
    dbMock.upsertUserMealLog.mockResolvedValue(undefined);
    const caller = mealHistoryRouter.createCaller(contextForUser(31));
    const localRecord = {
      clientLogId: "local-2",
      mealSlug: "laksa",
      mealName: "Laksa",
      carbonHundredths: 653,
      servings: 2,
      category: "Non Vegetarian" as const,
      entryMethod: "camera" as const,
      localDate: "2026-08-23",
      loggedAt: new Date("2026-08-23T09:00:00.000Z"),
    };

    const result = await caller.import([localRecord]);

    expect(result).toEqual({ imported: 1 });
    expect(dbMock.upsertUserMealLog).toHaveBeenCalledWith(31, localRecord);
  });

  it("uses the signed in owner for edit, delete, and clear day actions", async () => {
    dbMock.updateUserMealLogServings.mockResolvedValue(true);
    dbMock.deleteUserMealLog.mockResolvedValue(true);
    dbMock.clearUserMealLogsForDate.mockResolvedValue(undefined);
    const caller = mealHistoryRouter.createCaller(contextForUser(41));

    await caller.updateServings({ id: 9, servings: 3 });
    await caller.delete({ id: 9 });
    await caller.clearDate({ localDate: "2026-08-23" });

    expect(dbMock.updateUserMealLogServings).toHaveBeenCalledWith(41, 9, 3);
    expect(dbMock.deleteUserMealLog).toHaveBeenCalledWith(41, 9);
    expect(dbMock.clearUserMealLogsForDate).toHaveBeenCalledWith(41, "2026-08-23");
  });

  it("does not allow a visitor without a signed in account", async () => {
    const caller = mealHistoryRouter.createCaller(contextForUser(null));

    await expect(caller.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
