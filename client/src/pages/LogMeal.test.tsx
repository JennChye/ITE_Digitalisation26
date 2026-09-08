// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readMealLogs } from "@/lib/mealHistoryService";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  mutate: vi.fn(),
}));

vi.mock("@/hooks/useCloudFoods", async () => {
  const catalog = await vi.importActual<typeof import("@/lib/foodDatabase")>("@/lib/foodDatabase");
  return { useCloudFoods: () => ({ foods: catalog.foods }) };
});

vi.mock("@/hooks/useMealCloudSync", () => ({
  useMealCloudSync: () => ({ isAuthenticated: true, syncLog: vi.fn() }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: { mealRecognition: { scan: { useMutation: () => ({ mutate: mocks.mutate }) } } },
}));

vi.mock("@/lib/cameraService", () => ({
  CameraAccessError: class CameraAccessError extends Error { issue = "unavailable"; },
  deleteTemporaryPhoto: vi.fn(),
  getMealPhotoFileError: () => null,
  prepareMealPhoto: vi.fn().mockResolvedValue({ photoUrl: "blob:prepared-photo", imageDataUrl: "data:image/jpeg;base64,prepared" }),
  requestCameraPreview: vi.fn().mockResolvedValue({ getTracks: () => [] }),
  stopCameraPreview: vi.fn(),
}));

vi.mock("@/components/BottomNavigation", () => ({ default: () => null }));
vi.mock("wouter", () => ({ useLocation: () => ["/log", mocks.navigate] }));

import LogMeal, { PhotoRecognitionFallback } from "./LogMeal";

afterEach(() => {
  cleanup();
});

describe("unclear photo camera recovery", () => {
  it("shows visible ingredient context and lets a student retake, enter manually, or build an estimate", () => {
    const onRetake = vi.fn();
    const onManual = vi.fn();
    const onFlexibleEstimate = vi.fn();
    render(<PhotoRecognitionFallback candidateName="Mixed noodles" imageQuality="limited" ingredients={["noodles", "egg"]} matchExplanation="The bowl is partly hidden." reviewNote="Please check the meal yourself." onRetake={onRetake} onManual={onManual} onFlexibleEstimate={onFlexibleEstimate} />);

    expect(screen.getByText("Possible dish: Mixed noodles")).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "Detected ingredient 1" }) as HTMLInputElement).value).toBe("noodles");
    expect((screen.getByRole("textbox", { name: "Detected ingredient 2" }) as HTMLInputElement).value).toBe("egg");
    expect(screen.getByText("Suggested flexible estimate")).toBeTruthy();
    expect(screen.getByText(/kg CO2e/)).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Detected ingredient 1" }), { target: { value: "rice noodles" } });
    fireEvent.click(screen.getByRole("button", { name: /remove detected ingredient 2/i }));
    fireEvent.click(screen.getByRole("button", { name: /retake photo/i }));
    fireEvent.click(screen.getByRole("button", { name: /enter manually/i }));
    fireEvent.click(screen.getByRole("button", { name: /build a flexible estimate/i }));

    expect(onFlexibleEstimate).toHaveBeenLastCalledWith(["rice noodles"]);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(onRetake).toHaveBeenCalledTimes(1);
    expect(onManual).toHaveBeenCalledTimes(1);
    expect(onFlexibleEstimate).toHaveBeenCalledTimes(1);
  });
  it("shows Singapore source transparency and labelled correction controls for a rice photo suggestion", () => {
    render(<PhotoRecognitionFallback candidateName="Rice bowl" imageQuality="clear" ingredients={["rice", "egg"]} matchExplanation="Rice is visible." reviewNote="Check the suggested assumptions." onRetake={vi.fn()} onManual={vi.fn()} onFlexibleEstimate={vi.fn()} />);

    expect(screen.getByText(/Factor sources:.*Singapore Ecosperity food impact report/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /view Singapore food impact report/i })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Detected ingredient 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /remove detected ingredient 1/i })).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
  });
});

describe("flexible estimate navigation from Log a Meal", () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.mutate.mockReset();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("takes an unsupported manual meal into a prefilled flexible estimate", () => {
    render(<LogMeal />);
    fireEvent.click(screen.getByRole("button", { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText("Meal name"), { target: { value: "Mutton rice" } });
    fireEvent.click(screen.getByRole("button", { name: /build flexible estimate for this meal/i }));

    expect(mocks.navigate).toHaveBeenCalledWith("/custom-estimate?meal=Mutton+rice");
  });

  it("saves an optional private meal location with a manual meal entry", () => {
    render(<LogMeal />);
    fireEvent.click(screen.getByRole("button", { name: /enter manually/i }));
    fireEvent.click(screen.getByRole("option", { name: /Chicken Rice/i }));
    fireEvent.change(screen.getByLabelText(/Where did you have it/i), { target: { value: "ITE canteen" } });
    fireEvent.click(screen.getByRole("button", { name: "Save supported meal" }));

    expect(readMealLogs()[0]).toMatchObject({ mealName: "Chicken Rice", location: "ITE canteen" });
  });

  it("saves and reuses a private favourite meal place during manual entry", () => {
    render(<LogMeal />);
    fireEvent.click(screen.getByRole("button", { name: /enter manually/i }));
    const locationInput = screen.getByLabelText("Where did you have it") as HTMLInputElement;
    fireEvent.change(locationInput, { target: { value: "ITE canteen" } });
    fireEvent.click(screen.getByRole("button", { name: /save.*favourite place/i }));
    fireEvent.change(locationInput, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "ITE canteen" }));

    expect(locationInput.value).toBe("ITE canteen");
  });

  it("takes an unclear photo candidate and detected ingredients into a prefilled flexible estimate", async () => {
    mocks.mutate.mockImplementation((_input, options) => {
      options.onSuccess({
        status: "unclear",
        confidence: 48,
        imageQuality: "limited",
        candidateName: "Prawn curry mee",
        ingredients: ["prawns", "coconut milk", "noodles"],
        matchExplanation: "The bowl is partly hidden.",
        reviewNote: "Please check the ingredients.",
      });
    });

    render(<LogMeal />);
    fireEvent.change(screen.getByLabelText("Upload meal photo"), { target: { files: [new File(["photo"], "meal.jpg", { type: "image/jpeg" })] } });
    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(1));
    await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 600)); });
    fireEvent.change(await screen.findByRole("textbox", { name: "Detected ingredient 1" }), { target: { value: "rice noodles" } });
    fireEvent.click(await screen.findByRole("button", { name: /remove detected ingredient 2/i }));
    fireEvent.click(await screen.findByRole("button", { name: /remove detected ingredient 2/i }));
    fireEvent.click(await screen.findByRole("button", { name: /build a flexible estimate/i }));

    expect(mocks.navigate).toHaveBeenCalledWith("/custom-estimate?meal=Prawn+curry+mee&ingredients=rice+noodles");
  });
});
