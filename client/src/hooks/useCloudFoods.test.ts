import { describe, expect, it } from "vitest";
import { foods as localFoods } from "@/lib/foodDatabase";
import { getMealImage, MEAL_IMAGE_URLS } from "@/lib/mealImages";
import { mergeCloudFoods } from "./useCloudFoods";

describe("cloud published meal merge", () => {
  it("keeps Singapore research separate and appends regional research records", () => {
    const merged = mergeCloudFoods(localFoods, [
      { slug: "chicken-rice", name: "Chicken Rice", carbonScore: 3.13, category: "Non Vegetarian", estimateMethod: "published_research", sourceLabel: "IPUR NUS", sourceUrl: "https://ipur.nus.edu.sg", sourcePublishedOn: "2025-10-14", factors: ["Singapore research"] },
      { slug: "thai-tom-yum-gong", name: "Thai Tom Yum Gong Soup", carbonScore: 1.08, category: "Non Vegetarian", estimateMethod: "regional_research", sourceLabel: "Pan Asian record 696", sourceUrl: "https://doi.org/10.6084/m9.figshare.25999843.v3", sourcePublishedOn: "2025-05-05", factors: ["Country: Thailand"] },
    ]);

    expect(merged.find((food) => food.id === "chicken-rice")?.estimateMethod).toBe("Published meal research");
    expect(merged.find((food) => food.id === "thai-tom-yum-gong")).toMatchObject({ carbonScore: 1.08, estimateMethod: "Regional research dataset", sourceLabel: "Pan Asian record 696" });
  });

  it("adds further regional dish records without overwriting the existing local catalogue", () => {
    const merged = mergeCloudFoods(localFoods, [
      { slug: "pad-thai-thailand", name: "Pad Thai", carbonScore: 0.37, category: "Non Vegetarian", estimateMethod: "regional_research", sourceLabel: "Pan Asian record 697", sourceUrl: "https://doi.org/10.6084/m9.figshare.25999843.v3", sourcePublishedOn: "2025-05-05", factors: ["Country: Thailand"] },
      { slug: "beef-pho-vietnam", name: "Beef Pho", carbonScore: 1.26, category: "Non Vegetarian", estimateMethod: "regional_research", sourceLabel: "Pan Asian record E2963", sourceUrl: "https://doi.org/10.6084/m9.figshare.25999843.v3", sourcePublishedOn: "2025-05-05", factors: ["Country: Vietnam"] },
      { slug: "vegetable-biryani-india", name: "Vegetable Biryani", carbonScore: 0.26, category: "Vegetarian", estimateMethod: "regional_research", sourceLabel: "Pan Asian record E1995", sourceUrl: "https://doi.org/10.6084/m9.figshare.25999843.v3", sourcePublishedOn: "2025-05-05", factors: ["Country: India"] },
    ]);

    expect(merged).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pad-thai-thailand", carbonScore: 0.37, sourceLabel: "Pan Asian record 697" }),
      expect.objectContaining({ id: "beef-pho-vietnam", carbonScore: 1.26, sourceLabel: "Pan Asian record E2963" }),
      expect.objectContaining({ id: "vegetable-biryani-india", category: "Vegetarian", estimateMethod: "Regional research dataset" }),
    ]));
    expect(merged.find((food) => food.id === "chicken-rice")?.name).toBe("Chicken Rice");
  });

  it("links generated food images to local and regional dishes", () => {
    const merged = mergeCloudFoods(localFoods, [
      { slug: "beef-pho-vietnam", name: "Beef Pho", carbonScore: 1.26, category: "Non Vegetarian", estimateMethod: "regional_research", sourceLabel: "Pan Asian record E2963", sourceUrl: "https://doi.org/10.6084/m9.figshare.25999843.v3", sourcePublishedOn: "2025-05-05", factors: ["Country: Vietnam"] },
    ]);

    expect(merged.find((food) => food.id === "nasi-lemak")?.image).toBe(getMealImage("nasi-lemak"));
    expect(merged.find((food) => food.id === "beef-pho-vietnam")?.image).toBe(getMealImage("beef-pho-vietnam"));
    expect(Object.keys(MEAL_IMAGE_URLS)).toHaveLength(30);
    expect(getMealImage("vegetable-biryani-india")).toContain("vegetable-biryani-india");
    expect(localFoods.every((food) => Boolean(food.image ?? getMealImage(food.id)))).toBe(true);
    expect(Object.values(MEAL_IMAGE_URLS).every((url) => url.startsWith("/manus-storage/"))).toBe(true);
  });
});
