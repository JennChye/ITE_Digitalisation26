// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("@/components/BottomNavigation", () => ({ default: () => null }));
vi.mock("wouter", () => ({ useLocation: () => ["/community-safety", mocks.navigate] }));

import CommunitySafety from "./CommunitySafety";

describe("Community Safety page", () => {
  it("shows clear safety rules and student support guidance", () => {
    render(<CommunitySafety />);
    expect(screen.getByRole("heading", { name: /safety rules for sharing/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /keep personal details private/i })).toBeTruthy();
    expect(screen.getByText(/speak to a trusted adult/i)).toBeTruthy();
  });

  it("links back to Student Community", () => {
    render(<CommunitySafety />);
    fireEvent.click(screen.getAllByRole("button", { name: "Student Community" })[0]);
    expect(mocks.navigate).toHaveBeenCalledWith("/community");
  });
});
