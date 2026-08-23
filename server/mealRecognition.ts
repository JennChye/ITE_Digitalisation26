import { foods, type Food } from "../client/src/lib/foodDatabase";
import { invokeLLM } from "./_core/llm";

export type PhotoRecognitionCandidate = {
  candidateId: string | null;
  candidateName: string;
  confidence: number;
  ingredients: string[];
  reviewNote: string;
};

export type MatchedPhotoRecognition = {
  status: "matched";
  confidence: number;
  recognisedMeal: Food;
  ingredients: string[];
  reviewNote: string;
};

export type UnclearPhotoRecognition = {
  status: "unclear";
  confidence: number;
  candidateName: string;
  ingredients: string[];
  reviewNote: string;
};

export type PhotoRecognition = MatchedPhotoRecognition | UnclearPhotoRecognition;

export function matchPhotoCandidate(candidate: PhotoRecognitionCandidate, catalog: Food[] = foods): PhotoRecognition {
  const matchedFood = candidate.candidateId ? catalog.find((food) => food.id === candidate.candidateId) : undefined;
  const safeIngredients = candidate.ingredients.filter((ingredient) => ingredient.trim().length > 0).slice(0, 8);
  const confidence = Math.max(0, Math.min(100, Math.round(candidate.confidence)));

  if (matchedFood && confidence >= 60) {
    return {
      status: "matched",
      confidence,
      recognisedMeal: matchedFood,
      ingredients: safeIngredients,
      reviewNote: candidate.reviewNote,
    };
  }

  return {
    status: "unclear",
    confidence,
    candidateName: candidate.candidateName,
    ingredients: safeIngredients,
    reviewNote: candidate.reviewNote,
  };
}

const candidateIds = foods.map((food) => food.id);
const catalogDescription = foods.map((food) => `${food.id}: ${food.name}. Known impact factors: ${food.factors.join(", ")}.`).join("\n");

const photoSchema = {
  type: "object",
  properties: {
    candidateId: { type: ["string", "null"], enum: [...candidateIds, null] },
    candidateName: { type: "string" },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    ingredients: { type: "array", items: { type: "string" }, maxItems: 8 },
    reviewNote: { type: "string" },
  },
  required: ["candidateId", "candidateName", "confidence", "ingredients", "reviewNote"],
  additionalProperties: false,
} as const;

export async function recogniseMealPhoto(imageDataUrl: string): Promise<PhotoRecognition> {
  const response = await invokeLLM({
    model: "gemini-3-flash-preview",
    maxTokens: 700,
    messages: [
      {
        role: "system",
        content: `You review a single meal photo for a student sustainability prototype. Identify only visible or strongly supported food ingredients. Choose a candidateId only when the photo reasonably matches one exact known dish. Otherwise candidateId must be null. Never invent a carbon number, never identify people, and use careful wording. The known dishes are:\n${catalogDescription}`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyse this meal photo. Return a short review note that asks the student to check the result before saving." },
          { type: "image_url", image_url: { url: imageDataUrl, detail: "low" } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "meal_photo_recognition", strict: true, schema: photoSchema },
    },
  });

  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("The meal photo could not be analysed.");
  return matchPhotoCandidate(JSON.parse(content) as PhotoRecognitionCandidate);
}
