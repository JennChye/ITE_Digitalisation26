// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("@/components/BottomNavigation", () => ({ default: () => null }));
vi.mock("wouter", () => ({ useLocation: () => ["/teacher-moderation", mocks.navigate] }));

import { COMMUNITY_STORAGE_KEY, createInitialCommunityState, reportCommunityPost } from "@/lib/communityService";
import TeacherModeration from "./TeacherModeration";

function seedReportedPost() {
  window.localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(reportCommunityPost(createInitialCommunityState(), "sample-1")));
}

describe("Teacher Moderation page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.navigate.mockReset();
    seedReportedPost();
  });

  afterEach(() => cleanup());

  it("shows a reported post in the teacher review queue", () => {
    render(<TeacherModeration />);
    expect(screen.getByRole("heading", { name: /review reports with care/i })).toBeTruthy();
    expect(screen.getByText("Green Explorer 24")).toBeTruthy();
    expect(screen.getByRole("button", { name: /restore to feed/i })).toBeTruthy();
  });

  it("lets a teacher restore or hide a reported post", () => {
    const restored = render(<TeacherModeration />);
    fireEvent.click(screen.getByRole("button", { name: /restore to feed/i }));
    expect(screen.getByText(/no open reports right now/i)).toBeTruthy();
    expect(screen.getByText("Restored")).toBeTruthy();
    restored.unmount();

    seedReportedPost();
    render(<TeacherModeration />);
    fireEvent.click(screen.getByRole("button", { name: /hide from feed/i }));
    expect(screen.getByText(/no open reports right now/i)).toBeTruthy();
    expect(screen.getByText("Hidden")).toBeTruthy();
  });

  it("requires confirmation before removing a reported prototype post", () => {
    render(<TeacherModeration />);
    fireEvent.click(screen.getByRole("button", { name: /remove post/i }));
    expect(screen.getByRole("alert").textContent).toMatch(/remove this prototype post/i);
    fireEvent.click(screen.getByRole("button", { name: /confirm remove/i }));
    expect(screen.getByText(/no open reports right now/i)).toBeTruthy();
  });
});
