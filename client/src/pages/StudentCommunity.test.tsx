// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("@/components/BottomNavigation", () => ({ default: () => null }));
vi.mock("wouter", () => ({ useLocation: () => ["/community", mocks.navigate] }));

import StudentCommunity from "./StudentCommunity";

describe("Student Community page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.navigate.mockReset();
  });

  afterEach(() => cleanup());

  function makePostPublic() {
    fireEvent.click(screen.getByRole("checkbox", { name: "Keep all progress private" }));
    fireEvent.change(screen.getByLabelText("Anonymous display name"), { target: { value: "Kind Hawker 12" } });
    fireEvent.change(screen.getByLabelText("Meals logged"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Weekly kg CO2e"), { target: { value: "8.2" } });
    fireEvent.change(screen.getByLabelText("One positive learning message"), { target: { value: "I explored a vegetable lunch this week." } });
    fireEvent.click(screen.getByRole("button", { name: /preview post/i }));
  }

  it("opens the Student Community page", () => {
    render(<StudentCommunity />);
    expect(screen.getByRole("heading", { name: /learn together, share safely/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /class leaderboard/i })).toBeTruthy();
  });

  it("shows a preview before an anonymous post can be published", () => {
    render(<StudentCommunity />);
    makePostPublic();
    expect(screen.getByRole("dialog", { name: /check what is shared/i })).toBeTruthy();
    expect(screen.getByText("Kind Hawker 12")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /confirm and publish/i }));
    expect(screen.getByRole("button", { name: /delete shared post by kind hawker 12/i })).toBeTruthy();
  });

  it("does not show a post when progress is kept private", () => {
    render(<StudentCommunity />);
    fireEvent.click(screen.getByRole("button", { name: /preview post/i }));
    expect(screen.queryByRole("dialog", { name: /check what is shared/i })).toBeNull();
    expect(screen.getByRole("alert").textContent).toMatch(/keep all progress private/i);
  });

  it("allows a student to delete their own shared post", () => {
    render(<StudentCommunity />);
    makePostPublic();
    fireEvent.click(screen.getByRole("button", { name: /confirm and publish/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete shared post by kind hawker 12/i }));
    expect(screen.queryByRole("button", { name: /delete shared post by kind hawker 12/i })).toBeNull();
  });

  it("hides a reported post from the current student's feed", () => {
    render(<StudentCommunity />);
    fireEvent.click(screen.getByRole("button", { name: /report post by green explorer 24/i }));
    expect(screen.queryByRole("button", { name: /report post by green explorer 24/i })).toBeNull();
  });

  it("shows a student only after they choose to join the participation leaderboard", async () => {
    render(<StudentCommunity />);
    expect(screen.getByText(/you are not participating/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Join the participation leaderboard" }));
    await waitFor(() => expect(screen.getByText(/your current position/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("checkbox", { name: "Join the participation leaderboard" }));
    expect(screen.getByText(/you are not participating/i)).toBeTruthy();
  });
});
