import { describe, expect, it } from "vitest";
import { matchPhotoCandidate } from "./mealRecognition";

describe("photo meal recognition matching", () => {
  it("uses only a clear high confidence dish from the known database", () => {
    const result = matchPhotoCandidate({
      candidateId: "chicken-rice",
      candidateName: "Chicken Rice",
      confidence: 82,
      imageQuality: "clear",
      ingredients: ["chicken", "rice", "cucumber"],
      matchExplanation: "Sliced chicken, rice, and cucumber are visible.",
      reviewNote: "Please check the serving size.",
    });

    expect(result).toMatchObject({ status: "matched", recognisedMeal: { id: "chicken-rice" }, ingredients: ["chicken", "rice", "cucumber"], imageQuality: "clear" });
  });

  it("uses the safe unclear state for a low confidence or unknown suggestion", () => {
    const result = matchPhotoCandidate({
      candidateId: "not-a-known-dish",
      candidateName: "Unknown bowl",
      confidence: 69,
      imageQuality: "limited",
      ingredients: ["noodles"],
      matchExplanation: "The bowl is partly hidden.",
      reviewNote: "Try another photo.",
    });

    expect(result).toEqual(expect.objectContaining({ status: "unclear", candidateName: "Unknown bowl", ingredients: ["noodles"], imageQuality: "limited" }));
  });

  it("does not match a photo that is not clearly a meal and cleans visible ingredient labels", () => {
    const result = matchPhotoCandidate({
      candidateId: "laksa",
      candidateName: "  ",
      confidence: 96,
      imageQuality: "not-a-meal",
      ingredients: [" noodles ", "NOODLES", "", "egg", "lime", "tofu", "prawn", "chilli", "bean sprouts", "extra ingredient"],
      matchExplanation: "  ",
      reviewNote: "  ",
    });

    expect(result).toEqual(expect.objectContaining({
      status: "unclear",
      candidateName: "No supported dish identified",
      ingredients: ["noodles", "egg", "lime", "tofu", "prawn", "chilli", "bean sprouts", "extra ingredient"],
      matchExplanation: "The photo did not show enough clear details for a supported dish match.",
    }));
  });
});
