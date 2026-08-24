import { MAX_MEAL_LOCATION_LENGTH, normaliseMealLocation } from "./mealHistoryService";

export const FAVORITE_MEAL_PLACES_STORAGE_KEY = "platefootprint-favorite-meal-places-v1";
export const FAVORITE_MEAL_PLACES_EVENT = "platefootprint-favorite-meal-places-updated";
export const MAX_FAVORITE_MEAL_PLACES = 12;

export type FavoriteMealPlace = { id: string; label: string; createdAt: string };
type StorageLike = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}

function validPlace(value: unknown): value is FavoriteMealPlace {
  return Boolean(value && typeof value === "object" && typeof (value as FavoriteMealPlace).id === "string" && typeof (value as FavoriteMealPlace).label === "string" && typeof (value as FavoriteMealPlace).createdAt === "string");
}

function writeFavoriteMealPlaces(places: FavoriteMealPlace[], storage?: StorageLike | null) {
  const target = storage === undefined ? browserStorage() : storage;
  if (!target) return;
  try { target.setItem(FAVORITE_MEAL_PLACES_STORAGE_KEY, JSON.stringify(places)); } catch { /* The optional private feature can remain empty if storage is unavailable. */ }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(FAVORITE_MEAL_PLACES_EVENT));
}

export function readFavoriteMealPlaces(storage?: StorageLike | null): FavoriteMealPlace[] {
  const target = storage === undefined ? browserStorage() : storage;
  if (!target) return [];
  try {
    const raw = target.getItem(FAVORITE_MEAL_PLACES_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(validPlace).map((place) => ({ ...place, label: normaliseMealLocation(place.label) ?? "" })).filter((place) => place.label).slice(0, MAX_FAVORITE_MEAL_PLACES) : [];
  } catch { return []; }
}

function newId() { return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `place-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export function saveFavoriteMealPlace(label: string, storage?: StorageLike | null): FavoriteMealPlace | undefined {
  const cleaned = normaliseMealLocation(label);
  if (!cleaned || cleaned.length > MAX_MEAL_LOCATION_LENGTH) return undefined;
  const existing = readFavoriteMealPlaces(storage);
  const match = existing.find((place) => place.label.toLowerCase() === cleaned.toLowerCase());
  const favourite = match ?? { id: newId(), label: cleaned, createdAt: new Date().toISOString() };
  writeFavoriteMealPlaces([favourite, ...existing.filter((place) => place.id !== favourite.id)].slice(0, MAX_FAVORITE_MEAL_PLACES), storage);
  return favourite;
}

export function removeFavoriteMealPlace(id: string, storage?: StorageLike | null) {
  const next = readFavoriteMealPlaces(storage).filter((place) => place.id !== id);
  writeFavoriteMealPlaces(next, storage);
  return next;
}
