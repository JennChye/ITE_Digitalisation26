// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { COMMUNITY_STORAGE_KEY } from "./communityService";
import { FAVORITE_MEAL_PLACES_STORAGE_KEY, MAX_FAVORITE_MEAL_PLACES, readFavoriteMealPlaces, removeFavoriteMealPlace, saveFavoriteMealPlace } from "./favoriteMealPlaces";
import { POSITIVE_LEARNING_STORAGE_KEY } from "./positiveLearning";

function storage() { const values = new Map<string, string>(); return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), keys: () => [...values.keys()] }; }

describe("private favourite meal places", () => {
  it("saves a trimmed favourite place without a meal history or community record", () => {
    const target = storage();
    saveFavoriteMealPlace("  ITE canteen  ", target);
    expect(readFavoriteMealPlaces(target)).toMatchObject([{ label: "ITE canteen" }]);
  });

  it("keeps favourite places in their own browser local storage key", () => {
    const target = storage();
    saveFavoriteMealPlace("Hawker centre", target);

    expect(target.keys()).toEqual([FAVORITE_MEAL_PLACES_STORAGE_KEY]);
  });

  it("does not change community, badge, or monthly reflection browser storage", () => {
    window.localStorage.clear();
    window.localStorage.setItem(COMMUNITY_STORAGE_KEY, '{"posts":["community post"]}');
    window.localStorage.setItem(POSITIVE_LEARNING_STORAGE_KEY, '{"badge":"Leaf Starter","monthlyReflections":["private note"]}');
    const communityBefore = window.localStorage.getItem(COMMUNITY_STORAGE_KEY);
    const learningBefore = window.localStorage.getItem(POSITIVE_LEARNING_STORAGE_KEY);

    saveFavoriteMealPlace("ITE canteen");

    expect(window.localStorage.getItem(COMMUNITY_STORAGE_KEY)).toBe(communityBefore);
    expect(window.localStorage.getItem(POSITIVE_LEARNING_STORAGE_KEY)).toBe(learningBefore);
  });

  it("deduplicates places without changing their private label", () => {
    const target = storage();
    saveFavoriteMealPlace("Home", target);
    saveFavoriteMealPlace("home", target);
    expect(readFavoriteMealPlaces(target)).toHaveLength(1);
  });

  it("limits favourites and lets a student remove a saved place", () => {
    const target = storage();
    Array.from({ length: MAX_FAVORITE_MEAL_PLACES + 3 }, (_, index) => saveFavoriteMealPlace(`Place ${index}`, target));
    const places = readFavoriteMealPlaces(target);
    expect(places).toHaveLength(MAX_FAVORITE_MEAL_PLACES);
    expect(removeFavoriteMealPlace(places[0].id, target)).toHaveLength(MAX_FAVORITE_MEAL_PLACES - 1);
  });
});
