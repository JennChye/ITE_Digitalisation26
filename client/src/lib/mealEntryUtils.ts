import { Food, foods } from "./foodDatabase";

export const MIN_ENTRY_SERVINGS = 1;
export const MAX_ENTRY_SERVINGS = 20;
export const MEAL_ENTRY_OPTIONS = ["Take a Photo", "Enter Manually"] as const;
export const PHOTO_CAPTURE_NEXT_MODE = "scanning";
export const UNCLEAR_PHOTO_MESSAGE =
  "We could not confidently identify this meal. Please select a dish or enter it manually.";
export const UNCLEAR_PHOTO_ACTIONS = ["Retake photo", "Enter manually"] as const;
export const UNSUPPORTED_MEAL_MESSAGE =
  "We could not match this meal to a supported dish. Please select a supported dish instead.";

export type RecognitionResult =
  | { kind: "match"; food: Food; message: string }
  | { kind: "unclear"; message: string };

export function validateEntryServings(value: number | string): string | null {
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (!Number.isInteger(numericValue) || numericValue < MIN_ENTRY_SERVINGS || numericValue > MAX_ENTRY_SERVINGS) {
    return "Serving size must be a whole number from one to twenty.";
  }
  return null;
}

export function findSupportedFood(value: string, catalog: Food[] = foods): Food | undefined {
  const query = value.trim().toLowerCase();
  if (!query) return undefined;

  return catalog.find((food) => {
    const name = food.name.toLowerCase();
    return name === query || name.includes(query) || query.includes(name) || query.includes(food.id.replaceAll("-", " "));
  });
}

export function searchSupportedFoods(query: string, catalog: Food[] = foods): Food[] {
  const normalisedQuery = query.trim().toLowerCase();
  if (!normalisedQuery) return catalog;

  if (normalisedQuery === "vegetarian") {
    return catalog.filter((food) => food.category === "Vegetarian");
  }

  return catalog.filter((food) => {
    const searchText = `${food.name} ${food.category} ${food.id.replaceAll("-", " ")}`.toLowerCase();
    return searchText.includes(normalisedQuery);
  });
}

export function getPrototypeRecognition(description: string, catalog: Food[] = foods): RecognitionResult {
  const food = findSupportedFood(description, catalog);
  if (!food) return { kind: "unclear", message: UNCLEAR_PHOTO_MESSAGE };

  return {
    kind: "match",
    food,
    message: "Prototype estimate based on the description you provided. Please check the meal and serving size before saving.",
  };
}
