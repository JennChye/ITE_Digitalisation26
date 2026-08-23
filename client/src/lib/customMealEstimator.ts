import { FoodCategory } from "./foodDatabase";
import { MAX_ENTRY_SERVINGS, MIN_ENTRY_SERVINGS, validateEntryServings } from "./mealEntryUtils";

export type CustomProteinId = "tofu" | "egg" | "chicken" | "fish" | "pork" | "beef";
export type CustomBaseId = "rice" | "noodles" | "none";
export type CookingMethodId = "boiled" | "stir-fried" | "deep-fried" | "slow-cooked";

type EstimateOption<T extends string> = {
  id: T;
  label: string;
  carbonPer100g: number;
};

type CookingOption<T extends string> = {
  id: T;
  label: string;
  carbonPerServing: number;
};

export const MIN_INGREDIENT_AMOUNT_GRAMS = 25;
export const MAX_INGREDIENT_AMOUNT_GRAMS = 500;
export const INGREDIENT_AMOUNT_STEP_GRAMS = 25;

export const CUSTOM_PROTEINS: Array<EstimateOption<CustomProteinId> & { category: FoodCategory }> = [
  { id: "tofu", label: "Tofu or beans", carbonPer100g: 0.3, category: "Vegetarian" },
  { id: "egg", label: "Egg", carbonPer100g: 0.4, category: "Vegetarian" },
  { id: "chicken", label: "Chicken", carbonPer100g: 0.4, category: "Non Vegetarian" },
  { id: "fish", label: "Fish or seafood", carbonPer100g: 0.6, category: "Non Vegetarian" },
  { id: "pork", label: "Pork", carbonPer100g: 1.2, category: "Non Vegetarian" },
  { id: "beef", label: "Beef", carbonPer100g: 2.4, category: "Non Vegetarian" },
];

export const CUSTOM_BASES: EstimateOption<CustomBaseId>[] = [
  { id: "rice", label: "Rice", carbonPer100g: 0.23 },
  { id: "noodles", label: "Noodles", carbonPer100g: 0.27 },
  { id: "none", label: "No rice or noodles", carbonPer100g: 0 },
];

export const COOKING_METHODS: CookingOption<CookingMethodId>[] = [
  { id: "boiled", label: "Boiled or steamed", carbonPerServing: 0.1 },
  { id: "stir-fried", label: "Stir fried", carbonPerServing: 0.25 },
  { id: "deep-fried", label: "Deep fried", carbonPerServing: 0.45 },
  { id: "slow-cooked", label: "Slow cooked", carbonPerServing: 0.35 },
];

export const VEGETABLE_COMPONENT = { label: "Vegetables", carbonPer100g: 0.1 };
export const COCONUT_DAIRY_COMPONENT = { label: "Coconut or dairy", carbonPer100g: 0.35 };
export const CUSTOM_MEAL_NOTICE = "This is a custom prototype estimate based on your selected ingredients, amounts, and cooking method.";

export type CustomMealInput = {
  mealName: string;
  proteinId: CustomProteinId;
  baseId: CustomBaseId;
  cookingMethodId: CookingMethodId;
  includesVegetables: boolean;
  includesCoconutOrDairy: boolean;
  proteinAmountGrams: number;
  baseAmountGrams: number;
  vegetableAmountGrams: number;
  coconutOrDairyAmountGrams: number;
  servings: number;
};

export type CustomMealEstimate = {
  carbonPerServing: number;
  totalCarbonFootprint: number;
  category: FoodCategory;
  factors: string[];
  contributions: Array<{
    label: string;
    carbonPerServing: number;
    percentage: number;
  }>;
};

function findOption<T extends string>(options: EstimateOption<T>[], id: T): EstimateOption<T> {
  const option = options.find((item) => item.id === id);
  if (!option) throw new Error("Please choose a supported ingredient option.");
  return option;
}

function findCookingOption(id: CookingMethodId): CookingOption<CookingMethodId> {
  const option = COOKING_METHODS.find((item) => item.id === id);
  if (!option) throw new Error("Please choose a supported cooking method.");
  return option;
}

export function validateIngredientAmount(amount: number, label: string): string | null {
  if (!Number.isInteger(amount) || amount < MIN_INGREDIENT_AMOUNT_GRAMS || amount > MAX_INGREDIENT_AMOUNT_GRAMS) {
    return `${label} amount must be a whole number from ${MIN_INGREDIENT_AMOUNT_GRAMS} g to ${MAX_INGREDIENT_AMOUNT_GRAMS} g.`;
  }
  return null;
}

function amountFactor(carbonPer100g: number, amountGrams: number): number {
  return carbonPer100g * (amountGrams / 100);
}

export function validateCustomMealInput(input: Partial<CustomMealInput>): string | null {
  if (!input.mealName?.trim()) return "Please enter a name for your meal.";
  if (!input.proteinId || !CUSTOM_PROTEINS.some((option) => option.id === input.proteinId)) return "Please choose a main protein.";
  if (!input.baseId || !CUSTOM_BASES.some((option) => option.id === input.baseId)) return "Please choose a rice or noodle option.";
  if (!input.cookingMethodId || !COOKING_METHODS.some((option) => option.id === input.cookingMethodId)) return "Please choose a cooking method.";
  const proteinAmountError = validateIngredientAmount(input.proteinAmountGrams ?? 0, "Protein");
  if (proteinAmountError) return proteinAmountError;
  if (input.baseId !== "none") {
    const baseAmountError = validateIngredientAmount(input.baseAmountGrams ?? 0, "Rice or noodle");
    if (baseAmountError) return baseAmountError;
  }
  if (input.includesVegetables) {
    const vegetableAmountError = validateIngredientAmount(input.vegetableAmountGrams ?? 0, "Vegetable");
    if (vegetableAmountError) return vegetableAmountError;
  }
  if (input.includesCoconutOrDairy) {
    const coconutAmountError = validateIngredientAmount(input.coconutOrDairyAmountGrams ?? 0, "Coconut or dairy");
    if (coconutAmountError) return coconutAmountError;
  }
  return validateEntryServings(input.servings ?? MIN_ENTRY_SERVINGS);
}

export function estimateCustomMeal(input: CustomMealInput): CustomMealEstimate {
  const error = validateCustomMealInput(input);
  if (error) throw new Error(error);

  const protein = findOption(CUSTOM_PROTEINS, input.proteinId) as (typeof CUSTOM_PROTEINS)[number];
  const base = findOption(CUSTOM_BASES, input.baseId);
  const cooking = findCookingOption(input.cookingMethodId);
  const baseAmountGrams = input.baseId === "none" ? 0 : input.baseAmountGrams;
  const components: Array<{ label: string; carbonPerServing: number }> = [
    { label: `${protein.label} ${input.proteinAmountGrams} g`, carbonPerServing: amountFactor(protein.carbonPer100g, input.proteinAmountGrams) },
    { label: input.baseId === "none" ? base.label : `${base.label} ${baseAmountGrams} g`, carbonPerServing: amountFactor(base.carbonPer100g, baseAmountGrams) },
    cooking,
  ];
  if (input.includesVegetables) components.push({ label: `${VEGETABLE_COMPONENT.label} ${input.vegetableAmountGrams} g`, carbonPerServing: amountFactor(VEGETABLE_COMPONENT.carbonPer100g, input.vegetableAmountGrams) });
  if (input.includesCoconutOrDairy) components.push({ label: `${COCONUT_DAIRY_COMPONENT.label} ${input.coconutOrDairyAmountGrams} g`, carbonPerServing: amountFactor(COCONUT_DAIRY_COMPONENT.carbonPer100g, input.coconutOrDairyAmountGrams) });

  const rawCarbonPerServing = components.reduce((total, component) => total + component.carbonPerServing, 0);
  const carbonPerServing = Number(rawCarbonPerServing.toFixed(2));
  const servings = Math.min(MAX_ENTRY_SERVINGS, Math.max(MIN_ENTRY_SERVINGS, input.servings));
  const contributions = components
    .filter((component) => component.carbonPerServing > 0)
    .map((component) => ({
      label: component.label,
      carbonPerServing: Number(component.carbonPerServing.toFixed(2)),
      percentage: Number(((component.carbonPerServing / rawCarbonPerServing) * 100).toFixed(1)),
    }));

  return {
    carbonPerServing,
    totalCarbonFootprint: Number((carbonPerServing * servings).toFixed(2)),
    category: protein.category,
    factors: components.map((component) => component.label),
    contributions,
  };
}

export function createCustomMealId(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `custom-${slug || "meal"}`;
}
