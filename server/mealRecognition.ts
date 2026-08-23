import { foods, type Food } from "../client/src/lib/foodDatabase";
import { invokeLLM } from "./_core/llm";

export type ImageQuality = "clear" | "limited" | "not-a-meal";

export type PhotoRecognitionCandidate = {
  candidateId: string | null;
  candidateName: string;
  confidence: number;
  imageQuality: ImageQuality;
  ingredients: string[];
  matchExplanation: string;
  reviewNote: string;
};

export type MatchedPhotoRecognition = {
  status: "matched";
  confidence: number;
  imageQuality: ImageQuality;
  recognisedMeal: Food;
  ingredients: string[];
  matchExplanation: string;
  reviewNote: string;
};

export type UnclearPhotoRecognition = {
  status: "unclear";
  confidence: number;
  imageQuality: ImageQuality;
  candidateName: string;
  ingredients: string[];
  matchExplanation: string;
  reviewNote: string;
};

export type PhotoRecognition = MatchedPhotoRecognition | UnclearPhotoRecognition;

const MATCH_CONFIDENCE = 70;
const MAX_INGREDIENTS = 8;
const MAX_INGREDIENT_LENGTH = 48;

function safeText(value: string, fallback: string): string {
  const cleaned = value.trim().replace(/\s+/g, " ").slice(0, 220);
  return cleaned || fallback;
}

function safeIngredients(ingredients: string[]): string[] {
  const seen = new Set<string>();
  return ingredients.reduce<string[]>((result, ingredient) => {
    const cleaned = ingredient.trim().replace(/\s+/g, " ").slice(0, MAX_INGREDIENT_LENGTH);
    const key = cleaned.toLocaleLowerCase();
    if (!cleaned || seen.has(key) || result.length >= MAX_INGREDIENTS) return result;
    seen.add(key);
    result.push(cleaned);
    return result;
  }, []);
}

export function matchPhotoCandidate(candidate: PhotoRecognitionCandidate, catalog: Food[] = foods): PhotoRecognition {
  const matchedFood = candidate.candidateId ? catalog.find((food) => food.id === candidate.candidateId) : undefined;
  const confidence = Math.max(0, Math.min(100, Math.round(candidate.confidence)));
  const imageQuality: ImageQuality = ["clear", "limited", "not-a-meal"].includes(candidate.imageQuality) ? candidate.imageQuality : "limited";
  const ingredients = safeIngredients(candidate.ingredients);
  const candidateName = safeText(candidate.candidateName, "No supported dish identified");
  const matchExplanation = safeText(candidate.matchExplanation, "The photo did not show enough clear details for a supported dish match.");
  const reviewNote = safeText(candidate.reviewNote, "Please check the meal and serving size before saving.");

  if (matchedFood && confidence >= MATCH_CONFIDENCE && imageQuality !== "not-a-meal") {
    return {
      status: "matched",
      confidence,
      imageQuality,
      recognisedMeal: matchedFood,
      ingredients,
      matchExplanation,
      reviewNote,
    };
  }

  return {
    status: "unclear",
    confidence,
    imageQuality,
    candidateName,
    ingredients,
    matchExplanation,
    reviewNote,
  };
}

const candidateIds = foods.map((food) => food.id);
const catalogDescription = foods.map((food) => `${food.id}: ${food.name} (${food.category}).`).join("\n");

const photoSchema = {
  type: "object",
  properties: {
    candidateId: { type: ["string", "null"], enum: [...candidateIds, null] },
    candidateName: { type: "string" },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    imageQuality: { type: "string", enum: ["clear", "limited", "not-a-meal"] },
    ingredients: { type: "array", items: { type: "string" }, maxItems: MAX_INGREDIENTS },
    matchExplanation: { type: "string" },
    reviewNote: { type: "string" },
  },
  required: ["candidateId", "candidateName", "confidence", "imageQuality", "ingredients", "matchExplanation", "reviewNote"],
  additionalProperties: false,
} as const;

export async function recogniseMealPhoto(imageDataUrl: string): Promise<PhotoRecognition> {
  const response = await invokeLLM({
    model: "gemini-3-flash-preview",
    maxTokens: 900,
    messages: [
      {
        role: "system",
        content: `You review one meal photo for a student sustainability learning app. Your job is visual recognition, not carbon calculation. First assess imageQuality: clear means the meal is visible, limited means lighting, angle, blur, or a mixed plate makes recognition uncertain, and not-a-meal means there is no clear meal to analyse. Identify the main meal and only ingredients that are directly visible or strongly supported by the image. Do not infer hidden sauces, recipe methods, nutrition, allergens, people, location, or carbon values. Choose candidateId only when the image supports one exact known dish. If the meal is unclear, mixed, unsupported, or the confidence is below 70, candidateId must be null. The matchExplanation must explain the visible visual clues in one short sentence. The reviewNote must remind the student to check the result and serving size. Known dish labels are:\n${catalogDescription}`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyse this meal image. Return only the structured result. The student will review the dish, ingredients, and serving size before any estimate is saved." },
          { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
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
