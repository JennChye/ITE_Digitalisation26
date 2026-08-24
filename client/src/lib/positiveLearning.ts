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
  { id: "nasi-lemak-tempeh-vegetable", mealId: "nasi-lemak", original: "Nasi Lemak", alternative: "Nasi lemak with tempeh and extra cucumber", explanation: "A version with tempeh and more vegetables can be a useful option to explore instead of a larger fried meat portion.", limitation: "Coconut rice, sambal, side dishes, portion size, and cooking method can still change the estimate.", ingredients: ["coconut rice", "tempeh", "cucumber", "sambal"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "char-kway-teow-vegetable-bee-hoon", mealId: "char-kway-teow", original: "Char Kway Teow", alternative: "Vegetable bee hoon with tofu", explanation: "A vegetable and tofu based noodle option may use fewer animal ingredients for some recipes.", limitation: "Noodle type, oil, tofu, vegetables, portion size, and cooking energy still matter.", ingredients: ["rice vermicelli", "tofu", "vegetables"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "hokkien-mee-vegetable-noodle", mealId: "hokkien-mee", original: "Hokkien Mee", alternative: "Vegetable noodle soup with tofu", explanation: "This swaps seafood broth for a vegetable and tofu focused option that students can explore.", limitation: "The estimate depends on the broth, tofu, noodles, portion, and cooking method.", ingredients: ["noodles", "tofu", "vegetables", "vegetable broth"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "pork-wanton-mee-vegetable-wanton", mealId: "pork-wanton-mee", original: "Pork Wanton Mee", alternative: "Vegetable wanton noodle soup", explanation: "A vegetable filling and tofu option can be a different meal idea when it suits your preferences.", limitation: "The filling, noodles, soup, portion, and cooking method can change the estimate.", ingredients: ["noodles", "tofu", "vegetables", "vegetable wanton"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "fishball-noodle-tofu-soup", mealId: "fishball-noodle-soup", original: "Fishball Noodle Soup", alternative: "Tofu and vegetable noodle soup", explanation: "A tofu and vegetable soup is a familiar noodle option without fish based ingredients.", limitation: "The soup base, tofu amount, noodles, portion, and cooking energy affect the estimate.", ingredients: ["noodles", "tofu", "vegetables", "vegetable broth"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "mee-soto-tofu-soto", mealId: "mee-soto", original: "Mee Soto", alternative: "Tofu and vegetable mee soto", explanation: "A vegetable and tofu version keeps a similar noodle soup style while changing the main ingredients.", limitation: "The broth, spice paste, tofu, noodles, portion, and cooking method can change the estimate.", ingredients: ["noodles", "tofu", "vegetables", "spice paste"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "vegetarian-bee-hoon-extra-vegetables", mealId: "vegetarian-bee-hoon", original: "Vegetarian Bee Hoon", alternative: "Vegetarian bee hoon with extra vegetables", explanation: "Adding more vegetables can be a practical way to explore a balanced portion using a familiar dish.", limitation: "This is not a guaranteed lower estimate. Ingredients, oil, portion size, and cooking method still matter.", ingredients: ["rice vermicelli", "tofu", "vegetables"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "beef-rendang-tempeh-rendang", mealId: "beef-rendang-rice", original: "Beef Rendang Rice", alternative: "Tempeh and vegetable rendang with rice", explanation: "A tempeh and vegetable version can be a different local style to explore instead of beef.", limitation: "Coconut ingredients, rice, portion size, cooking time, and recipe can change the estimate.", ingredients: ["tempeh", "vegetables", "coconut", "rice"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "chicken-rice-greens-smaller-chicken", mealId: "chicken-rice", original: "Chicken Rice", alternative: "Chicken rice with Chinese greens and a smaller chicken portion", explanation: "Keeping a familiar rice meal while adding greens and changing the chicken portion is another idea to explore.", limitation: "This is not a fixed lower estimate. Chicken amount, rice, sauce, portion size, and cooking method still matter.", ingredients: ["chicken", "rice", "Chinese greens", "sauce"], vegetarian: false, culturalTags: [], comparisonReady: false },
  { id: "laksa-tofu-vegetable", mealId: "laksa", original: "Laksa", alternative: "Laksa style noodle soup with tofu and vegetables", explanation: "A tofu and vegetable noodle soup keeps familiar laksa flavours while changing the main ingredients.", limitation: "Coconut ingredients, noodles, tofu, vegetables, broth, and portion size can all change the estimate.", ingredients: ["noodles", "tofu", "vegetables", "coconut"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "biryani-smaller-chicken-raita", mealId: "chicken-biryani", original: "Chicken Biryani", alternative: "Chicken biryani with a smaller chicken portion and extra vegetable raita", explanation: "Adding vegetables and adjusting the chicken portion is a familiar way to explore a different biryani plate.", limitation: "The rice, chicken portion, dairy, vegetables, recipe, and cooking method can change the estimate.", ingredients: ["chicken", "rice", "vegetables", "yogurt"], vegetarian: false, culturalTags: [], comparisonReady: false },
  { id: "roti-prata-dhal-cucumber", mealId: "roti-prata", original: "Vegetarian Roti Prata", alternative: "Plain roti prata with dhal and cucumber", explanation: "Dhal and cucumber can add variety to a familiar prata meal when it suits your preferences.", limitation: "Flour, oil, dhal recipe, portion size, and cooking method still matter.", ingredients: ["flour", "lentils", "cucumber", "oil"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "nasi-lemak-egg-cucumber", mealId: "nasi-lemak", original: "Nasi Lemak", alternative: "Nasi lemak with egg, cucumber, and less fried chicken", explanation: "This keeps familiar nasi lemak sides while changing the fried chicken portion and adding more cucumber.", limitation: "Coconut rice, egg, sambal, side dishes, oil, and serving size can change the estimate.", ingredients: ["coconut rice", "egg", "cucumber", "sambal"], vegetarian: false, culturalTags: [], comparisonReady: false },
  { id: "char-kway-teow-tofu-greens", mealId: "char-kway-teow", original: "Char Kway Teow", alternative: "Kway teow with tofu and leafy greens", explanation: "A tofu and leafy green version is another hawker style noodle idea to explore.", limitation: "Noodles, oil, tofu, greens, seasoning, portion size, and cooking energy can change the estimate.", ingredients: ["rice noodles", "tofu", "leafy greens", "oil"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "hokkien-mee-greens-smaller-seafood", mealId: "hokkien-mee", original: "Hokkien Mee", alternative: "Hokkien mee with extra greens and a smaller seafood portion", explanation: "Adding vegetables and changing the seafood portion is a familiar way to explore a different plate.", limitation: "Seafood, broth, noodles, oil, vegetables, portion size, and cooking method can change the estimate.", ingredients: ["noodles", "seafood", "vegetables", "broth"], vegetarian: false, culturalTags: [], comparisonReady: false },
  { id: "pork-wanton-mee-mushroom-tofu", mealId: "pork-wanton-mee", original: "Pork Wanton Mee", alternative: "Mushroom and tofu wanton mee", explanation: "A mushroom and tofu filling offers a different wanton noodle idea when it suits your preferences.", limitation: "The filling, noodles, sauce, soup, portion size, and cooking method can change the estimate.", ingredients: ["noodles", "mushroom", "tofu", "vegetables"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "fishball-noodle-yong-tau-foo", mealId: "fishball-noodle-soup", original: "Fishball Noodle Soup", alternative: "Vegetable yong tau foo with noodles", explanation: "Vegetable yong tau foo and noodles can be another familiar hawker style soup option.", limitation: "The vegetables, tofu, noodles, soup base, portion size, and cooking method can change the estimate.", ingredients: ["tofu", "vegetables", "noodles", "soup"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "mee-soto-sprouts-tofu", mealId: "mee-soto", original: "Mee Soto", alternative: "Mee soto with bean sprouts and tofu", explanation: "Bean sprouts and tofu can change the main ingredients while keeping a familiar noodle soup style.", limitation: "The broth, spice paste, tofu, noodles, portion size, and cooking method can change the estimate.", ingredients: ["noodles", "tofu", "bean sprouts", "spice paste"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "vegetarian-bee-hoon-greens-tofu", mealId: "vegetarian-bee-hoon", original: "Vegetarian Bee Hoon", alternative: "Vegetarian bee hoon with tofu and leafy greens", explanation: "Adding tofu and leafy greens can be a practical way to vary a familiar vegetarian hawker meal.", limitation: "Noodles, tofu, greens, oil, portion size, and cooking method can change the estimate.", ingredients: ["rice vermicelli", "tofu", "leafy greens", "oil"], vegetarian: true, culturalTags: ["vegetarian"], comparisonReady: false },
  { id: "beef-rendang-smaller-beef-vegetables", mealId: "beef-rendang-rice", original: "Beef Rendang Rice", alternative: "Beef rendang with a smaller beef portion and vegetable sides", explanation: "Vegetable sides and a changed beef portion can be another way to explore a familiar rendang rice plate.", limitation: "Beef amount, coconut ingredients, rice, vegetables, cooking time, and recipe can change the estimate.", ingredients: ["beef", "vegetables", "coconut", "rice"], vegetarian: false, culturalTags: [], comparisonReady: false },
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
