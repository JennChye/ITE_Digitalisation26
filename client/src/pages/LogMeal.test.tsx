// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PhotoRecognitionFallback } from "./LogMeal";

describe("unclear photo camera recovery", () => {
  it("shows visible ingredient context and lets a student retake or enter manually", () => {
    const onRetake = vi.fn();
    const onManual = vi.fn();
    render(<PhotoRecognitionFallback candidateName="Mixed noodles" imageQuality="limited" ingredients={["noodles", "egg"]} matchExplanation="The bowl is partly hidden." reviewNote="Please check the meal yourself." onRetake={onRetake} onManual={onManual} />);

    expect(screen.getByText("Possible dish: Mixed noodles")).toBeTruthy();
    expect(screen.getByText("Possible visible ingredients: noodles, egg")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /retake photo/i }));
    fireEvent.click(screen.getByRole("button", { name: /enter manually/i }));

    expect(onRetake).toHaveBeenCalledTimes(1);
    expect(onManual).toHaveBeenCalledTimes(1);
  });
});
