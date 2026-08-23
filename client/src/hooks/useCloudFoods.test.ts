import { describe, expect, it } from "vitest";
import { foods as localFoods } from "@/lib/foodDatabase";
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
});
