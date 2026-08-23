import { describe, expect, it } from "vitest";
import { matchPhotoCandidate } from "./mealRecognition";

describe("photo meal recognition matching", () => {
  it("uses only a high confidence dish from the known database", () => {
    const result = matchPhotoCandidate({
      candidateId: "chicken-rice",
      candidateName: "Chicken Rice",
      confidence: 82,
      ingredients: ["chicken", "rice", "cucumber"],
      reviewNote: "Please check the serving size.",
    });

    expect(result).toMatchObject({ status: "matched", recognisedMeal: { id: "chicken-rice" }, ingredients: ["chicken", "rice", "cucumber"] });
  });

  it("uses the safe unclear state for a low confidence or unknown suggestion", () => {
    const result = matchPhotoCandidate({
      candidateId: "not-a-known-dish",
      candidateName: "Unknown bowl",
      confidence: 35,
      ingredients: ["noodles"],
      reviewNote: "Try another photo.",
    });

    expect(result).toEqual(expect.objectContaining({ status: "unclear", candidateName: "Unknown bowl", ingredients: ["noodles"] }));
  });
});
