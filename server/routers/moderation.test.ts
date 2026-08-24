import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const dbMock = vi.hoisted(() => ({
  listHiddenCommunityPostIds: vi.fn(),
  listModerationAudit: vi.fn(),
  listOpenModerationCases: vi.fn(),
  reportCommunityPost: vi.fn(),
  resolveModerationCase: vi.fn(),
}));

vi.mock("../db", () => dbMock);

import { moderationRouter } from "./moderation";

function contextForRole(role: "user" | "teacher" | "admin" | null): TrpcContext {
  return {
    user: role === null ? null : {
      id: 17,
      openId: "moderation-user",
      name: "Teacher One",
      email: "teacher@example.edu.sg",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("secure teacher moderation router", () => {
  const report = {
    postClientId: "sample-1",
    displayName: "Green Explorer 24",
    mealsLogged: 5,
    weeklyFootprintHundredths: 1240,
    message: "I explored a vegetable option this week.",
  };

  it("allows a signed in student to submit a limited community report", async () => {
    dbMock.reportCommunityPost.mockResolvedValue(undefined);
    const caller = moderationRouter.createCaller(contextForRole("user"));

    await caller.report(report);

    expect(dbMock.reportCommunityPost).toHaveBeenCalledWith(17, report);
  });

  it("shares only hidden or removed post ids with the public community feed", async () => {
    dbMock.listHiddenCommunityPostIds.mockResolvedValue(["sample-1"]);
    const caller = moderationRouter.createCaller(contextForRole(null));

    await expect(caller.hiddenPostIds()).resolves.toEqual(["sample-1"]);
    expect(dbMock.listHiddenCommunityPostIds).toHaveBeenCalledTimes(1);
  });

  it("blocks visitors and standard students from teacher only queues and audit history", async () => {
    const visitor = moderationRouter.createCaller(contextForRole(null));
    const student = moderationRouter.createCaller(contextForRole("user"));

    await expect(visitor.openCases()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(student.auditHistory()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows teachers and administrators to review and resolve with a reason", async () => {
    dbMock.listOpenModerationCases.mockResolvedValue([]);
    dbMock.listModerationAudit.mockResolvedValue([]);
    dbMock.resolveModerationCase.mockResolvedValue(true);
    const teacher = moderationRouter.createCaller(contextForRole("teacher"));
    const admin = moderationRouter.createCaller(contextForRole("admin"));

    await teacher.openCases();
    await admin.auditHistory();
    await teacher.resolve({ moderationCaseId: 8, action: "hidden", reason: "private_information" });

    expect(dbMock.listOpenModerationCases).toHaveBeenCalledTimes(1);
    expect(dbMock.listModerationAudit).toHaveBeenCalledTimes(1);
    expect(dbMock.resolveModerationCase).toHaveBeenCalledWith(17, 8, "hidden", "private_information");
  });
});
