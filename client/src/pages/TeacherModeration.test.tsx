// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: { data: [] as Array<Record<string, unknown>>, isLoading: false },
  auth: { loading: false, isAuthenticated: true, user: { role: "teacher" } as { role: "user" | "teacher" | "admin" } | null },
  cases: { data: [] as Array<Record<string, unknown>>, isLoading: false },
  mutate: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@/components/BottomNavigation", () => ({ default: () => null }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("wouter", () => ({ useLocation: () => ["/teacher-moderation", mocks.navigate] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ moderation: { openCases: { invalidate: vi.fn() }, auditHistory: { invalidate: vi.fn() } } }),
    moderation: {
      openCases: { useQuery: () => mocks.cases },
      auditHistory: { useQuery: () => mocks.audit },
      resolve: { useMutation: () => ({ isPending: false, mutate: mocks.mutate }) },
    },
  },
}));

import TeacherModeration from "./TeacherModeration";

const reportedCase = {
  id: 7,
  displayName: "Green Explorer 24",
  mealsLogged: 5,
  weeklyFootprintHundredths: 1240,
  message: "I explored a vegetable option this week.",
};

describe("Teacher Moderation page", () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.mutate.mockReset();
    mocks.auth = { loading: false, isAuthenticated: true, user: { role: "teacher" } };
    mocks.cases = { data: [reportedCase], isLoading: false };
    mocks.audit = { data: [], isLoading: false };
  });

  afterEach(() => cleanup());

  it("blocks a signed in student from the teacher moderation queue", () => {
    mocks.auth = { loading: false, isAuthenticated: true, user: { role: "user" } };
    render(<TeacherModeration />);
    expect(screen.getByText(/teacher access only/i)).toBeTruthy();
    expect(screen.queryByText("Green Explorer 24")).toBeNull();
  });

  it("lets a teacher select a reason before hiding a reported post", () => {
    render(<TeacherModeration />);
    fireEvent.change(screen.getByLabelText(/moderation reason for green explorer 24/i), { target: { value: "safety_concern" } });
    fireEvent.click(screen.getByRole("button", { name: /hide from feed/i }));
    expect(mocks.mutate).toHaveBeenCalledWith({ moderationCaseId: 7, action: "hidden", reason: "safety_concern" });
  });

  it("requires confirmation before a teacher removes a reported post", () => {
    render(<TeacherModeration />);
    fireEvent.click(screen.getByRole("button", { name: /remove post/i }));
    expect(screen.getByRole("alert").textContent).toMatch(/remove this reported post/i);
    fireEvent.click(screen.getByRole("button", { name: /confirm remove/i }));
    expect(mocks.mutate).toHaveBeenCalledWith({ moderationCaseId: 7, action: "removed", reason: "private_information" });
  });

  it("displays teacher audit history with an action and reason", () => {
    mocks.cases = { data: [], isLoading: false };
    mocks.audit = { data: [{ id: 8, displayName: "Curious Changemaker 08", action: "hidden", reason: "private_information", teacherName: "Teacher One", createdAt: new Date("2026-08-24T04:00:00.000Z") }], isLoading: false };
    render(<TeacherModeration />);
    expect(screen.getByText("Curious Changemaker 08")).toBeTruthy();
    expect(screen.getByText(/reason: private information/i)).toBeTruthy();
    expect(screen.getByText(/teacher: teacher one/i)).toBeTruthy();
  });
});
