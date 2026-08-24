import type { MealLog } from "./mealHistoryService";

export const POSITIVE_LEARNING_STORAGE_KEY = "platefootprint-positive-learning-v1";
export const POSITIVE_LEARNING_EVENT = "platefootprint-positive-learning-updated";

export type AchievementId = "first-plate" | "meal-explorer" | "local-food-learner" | "smart-swap-starter" | "weekly-tracker" | "waste-wise";
export type Achievement = { id: AchievementId; title: string; description: string; target: number; progress: number; earned: boolean };
export type PositiveLearningSettings = { badgesEnabled: boolean; recommendationsEnabled: boolean };
export type FoodPreferences = { vegetarianOnly: boolean; allergies: string[]; avoidedIngredients: string[]; culturalPreferences: string[] };
export type SwapActivity = { id: string; date: string; originalMealId: string; originalMealName: string; suggestedOption: string; loggedNewMeal: boolean };
export type PositiveLearningState = { settings: PositiveLearningSettings; preferences: FoodPreferences; viewedMealIds: string[]; viewedRecommendationIds: string[]; swapActivities: SwapActivity[]; celebratedBadgeIds: AchievementId[] };

export type SwapRecommendation = { id: string; mealId: string; original: string; alternative: string; explanation: string; limitation: string; ingredients: string[]; vegetarian: boolean; culturalTags: string[]; comparisonReady: boolean };

export const SINGAPORE_MEAL_IDS = ["chicken-rice", "laksa", "chicken-biryani", "roti-prata", "nasi-lemak", "char-kway-teow", "hokkien-mee", "pork-wanton-mee", "fishball-noodle-soup", "mee-soto", "vegetarian-bee-hoon", "beef-rendang-rice"];

export const SWAP_RECOMMENDATIONS: SwapRecommendation[] = [
  { id: "chicken-rice-vegetable-rice-bowl", mealId: "chicken-rice", original: "Chicken Rice", alternative: "Vegetable rice bowl with extra vegetables", explanation: "This option uses more vegetables and can use a smaller chicken portion. Planning the rice portion can also help avoid leftovers.", limitation: "The estimate can still change with the recipe, serving size, and ingredients chosen.", ingredients: ["rice", "vegetables", "tofu"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "laksa-vegetable-noodle-soup", mealId: "laksa", original: "Laksa", alternative: "Vegetable based noodle soup", explanation: "A version with vegetables and less seafood may have a lower estimated footprint for some recipes.", limitation: "The result depends on the recipe, seafood amount, coconut ingredients, and portion size.", ingredients: ["noodles", "vegetables", "tofu"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "biryani-vegetable-biryani", mealId: "chicken-biryani", original: "Chicken Biryani", alternative: "Vegetable biryani with more vegetables", explanation: "A vegetable focused biryani may have a lower estimated footprint for some ingredient choices.", limitation: "The estimate depends on the ingredients and cooking method.", ingredients: ["rice", "vegetables", "lentils"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "roti-prata-vegetable-curry", mealId: "roti-prata", original: "Vegetarian Roti Prata", alternative: "Plain roti prata with vegetable curry", explanation: "This is an option that may have a lower estimate than some meat or fish based alternatives.", limitation: "It is not universally lower. The portion, oil, curry, and recipe still matter.", ingredients: ["flour", "vegetables", "curry"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
];

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function emptyState(): PositiveLearningState {
  return {
    settings: { badgesEnabled: true, recommendationsEnabled: true },
    preferences: { vegetarianOnly: false, allergies: [], avoidedIngredients: [], culturalPreferences: [] },
    viewedMealIds: [],
    viewedRecommendationIds: [],
    swapActivities: [],
    celebratedBadgeIds: [],
  };
}

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}

function normaliseList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))).slice(0, 20);
}

function validState(value: unknown): PositiveLearningState {
  const fallback = emptyState();
  if (!value || typeof value !== "object") return fallback;
  const input = value as Partial<PositiveLearningState>;
  return {
    settings: { badgesEnabled: input.settings?.badgesEnabled !== false, recommendationsEnabled: input.settings?.recommendationsEnabled !== false },
    preferences: {
      vegetarianOnly: input.preferences?.vegetarianOnly === true,
      allergies: normaliseList(input.preferences?.allergies),
      avoidedIngredients: normaliseList(input.preferences?.avoidedIngredients),
      culturalPreferences: normaliseList(input.preferences?.culturalPreferences),
    },
    viewedMealIds: normaliseList(input.viewedMealIds),
    viewedRecommendationIds: normaliseList(input.viewedRecommendationIds),
    swapActivities: Array.isArray(input.swapActivities) ? input.swapActivities.filter((activity): activity is SwapActivity => Boolean(activity && typeof activity === "object" && typeof (activity as SwapActivity).id === "string" && typeof (activity as SwapActivity).date === "string" && typeof (activity as SwapActivity).originalMealId === "string" && typeof (activity as SwapActivity).originalMealName === "string" && typeof (activity as SwapActivity).suggestedOption === "string" && typeof (activity as SwapActivity).loggedNewMeal === "boolean")).slice(0, 100) : [],
    celebratedBadgeIds: normaliseList(input.celebratedBadgeIds).filter((id): id is AchievementId => ["first-plate", "meal-explorer", "local-food-learner", "smart-swap-starter", "weekly-tracker", "waste-wise"].includes(id)),
  };
}

function writeState(state: PositiveLearningState, storage?: StorageLike | null) {
  const target = storage === undefined ? browserStorage() : storage;
  if (!target) return;
  try { target.setItem(POSITIVE_LEARNING_STORAGE_KEY, JSON.stringify(state)); } catch { /* The feature remains usable in memory when storage is unavailable. */ }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(POSITIVE_LEARNING_EVENT));
}

export function readPositiveLearningState(storage?: StorageLike | null): PositiveLearningState {
  const target = storage === undefined ? browserStorage() : storage;
  if (!target) return emptyState();
  try { const raw = target.getItem(POSITIVE_LEARNING_STORAGE_KEY); return raw ? validState(JSON.parse(raw)) : emptyState(); } catch { return emptyState(); }
}

export function updatePositiveLearningState(update: (state: PositiveLearningState) => PositiveLearningState, storage?: StorageLike | null): PositiveLearningState {
  const next = validState(update(readPositiveLearningState(storage)));
  writeState(next, storage);
  return next;
}

function weekKey(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return date.toISOString().slice(0, 10);
}

function wasteNote(note: string | undefined) {
  return Boolean(note && /(waste|leftover|finish|share|portion|take.?away|pack.*home)/i.test(note));
}

export function calculateAchievements(logs: MealLog[], state: PositiveLearningState): Achievement[] {
  const uniqueMeals = new Set(logs.map((log) => log.mealId));
  const localViews = state.viewedMealIds.filter((id) => SINGAPORE_MEAL_IDS.includes(id)).length;
  const weeklyDays = new Map<string, Set<string>>();
  logs.forEach((log) => { const key = weekKey(log.localDate); const days = weeklyDays.get(key) ?? new Set<string>(); days.add(log.localDate); weeklyDays.set(key, days); });
  const maxWeeklyDays = Math.max(0, ...Array.from(weeklyDays.values(), (days) => days.size));
  const values: Array<Omit<Achievement, "earned">> = [
    { id: "first-plate", title: "First Plate", description: "Log one meal.", target: 1, progress: logs.length },
    { id: "meal-explorer", title: "Meal Explorer", description: "Log five different meals.", target: 5, progress: uniqueMeals.size },
    { id: "local-food-learner", title: "Local Food Learner", description: "View carbon details of three Singapore dishes.", target: 3, progress: localViews },
    { id: "smart-swap-starter", title: "Smart Swap Starter", description: "View three sustainable food recommendations.", target: 3, progress: state.viewedRecommendationIds.length },
    { id: "weekly-tracker", title: "Weekly Tracker", description: "Log meals on three different days in one week.", target: 3, progress: maxWeeklyDays },
    { id: "waste-wise", title: "Waste Wise", description: "Record a meal note about avoiding food waste.", target: 1, progress: logs.some((log) => wasteNote(log.note)) ? 1 : 0 },
  ];
  return values.map((achievement) => ({ ...achievement, progress: Math.min(achievement.progress, achievement.target), earned: achievement.progress >= achievement.target }));
}

export function evaluateNewAchievements(logs: MealLog[], storage?: StorageLike | null): AchievementId[] {
  const state = readPositiveLearningState(storage);
  if (!state.settings.badgesEnabled) return [];
  const earned = calculateAchievements(logs, state).filter((achievement) => achievement.earned).map((achievement) => achievement.id);
  const newlyEarned = earned.filter((id) => !state.celebratedBadgeIds.includes(id));
  if (newlyEarned.length) updatePositiveLearningState((current) => ({ ...current, celebratedBadgeIds: Array.from(new Set([...current.celebratedBadgeIds, ...newlyEarned])) }), storage);
  return newlyEarned;
}

export function recordMealDetailView(mealId: string, storage?: StorageLike | null) {
  return updatePositiveLearningState((state) => ({ ...state, viewedMealIds: Array.from(new Set([...state.viewedMealIds, mealId])) }), storage);
}

export function recordRecommendationView(recommendationId: string, storage?: StorageLike | null) {
  return updatePositiveLearningState((state) => ({ ...state, viewedRecommendationIds: Array.from(new Set([...state.viewedRecommendationIds, recommendationId])) }), storage);
}

export function recordSwapActivity(input: Omit<SwapActivity, "id" | "date"> & { date?: string }, storage?: StorageLike | null): SwapActivity {
  const activity: SwapActivity = { ...input, id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `swap-${Date.now()}`, date: input.date ?? new Date().toISOString() };
  updatePositiveLearningState((state) => ({ ...state, swapActivities: [activity, ...state.swapActivities] }), storage);
  return activity;
}

export function updatePositiveLearningSettings(settings: Partial<PositiveLearningSettings>, storage?: StorageLike | null) {
  return updatePositiveLearningState((state) => ({ ...state, settings: { ...state.settings, ...settings } }), storage);
}

export function updateFoodPreferences(preferences: Partial<FoodPreferences>, storage?: StorageLike | null) {
  return updatePositiveLearningState((state) => ({ ...state, preferences: { ...state.preferences, ...preferences } }), storage);
}

export function getFilteredRecommendations(mealId: string, preferences: FoodPreferences): SwapRecommendation[] {
  const blocked = [...preferences.allergies, ...preferences.avoidedIngredients].map((item) => item.toLowerCase().trim()).filter(Boolean);
  const culturalPreferences = preferences.culturalPreferences.map((item) => item.toLowerCase().trim()).filter(Boolean);
  return SWAP_RECOMMENDATIONS.filter((recommendation) => recommendation.mealId === mealId && (!preferences.vegetarianOnly || recommendation.vegetarian) && culturalPreferences.every((preference) => recommendation.culturalTags.includes(preference)) && !recommendation.ingredients.some((ingredient) => blocked.some((blockedItem) => ingredient.toLowerCase().includes(blockedItem) || blockedItem.includes(ingredient.toLowerCase()))));
}
