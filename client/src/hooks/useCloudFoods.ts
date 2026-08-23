import { Food, foods as localFoods } from "@/lib/foodDatabase";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

type CloudPublishedMeal = {
  slug: string;
  name: string;
  carbonScore: number;
  category: Food["category"];
  estimateMethod: "published_research" | "regional_research" | "prototype_estimate";
  sourceLabel: string;
  sourceUrl: string;
  sourcePublishedOn: string;
  factors: string[];
};

function estimateMethodLabel(method: CloudPublishedMeal["estimateMethod"]): Food["estimateMethod"] {
  if (method === "regional_research") return "Regional research dataset";
  if (method === "prototype_estimate") return "Prototype ingredient estimate";
  return "Published meal research";
}

function regionalGradient(index: number): string {
  const gradients = [
    "linear-gradient(135deg, #dcebd4 0%, #6d9e69 45%, #2d6b46 100%)",
    "linear-gradient(135deg, #f1e0b6 0%, #d5a75b 45%, #905735 100%)",
    "linear-gradient(135deg, #dceaf0 0%, #83b6bd 45%, #336a72 100%)",
    "linear-gradient(135deg, #ead8c9 0%, #c58363 45%, #824834 100%)",
  ];
  return gradients[index % gradients.length];
}

export function mergeCloudFoods(local: Food[], published: CloudPublishedMeal[] | undefined): Food[] {
  if (!published) return local;
  const mergedLocal = local.map((localFood) => {
    const cloudFood = published.find((record) => record.slug === localFood.id || record.name === localFood.name);
    if (!cloudFood) return localFood;
    return {
      ...localFood,
      carbonScore: cloudFood.carbonScore,
      category: cloudFood.category,
      factors: cloudFood.factors,
      estimateMethod: estimateMethodLabel(cloudFood.estimateMethod),
      sourceLabel: cloudFood.sourceLabel,
      sourceUrl: cloudFood.sourceUrl,
      sourcePublishedOn: cloudFood.sourcePublishedOn,
    };
  });
  const cloudOnly = published
    .filter((cloudFood) => !local.some((localFood) => localFood.id === cloudFood.slug || localFood.name === cloudFood.name))
    .map((cloudFood, index) => ({
      id: cloudFood.slug,
      name: cloudFood.name,
      carbonScore: cloudFood.carbonScore,
      category: cloudFood.category,
      cardGradient: regionalGradient(index),
      factors: cloudFood.factors,
      estimateMethod: estimateMethodLabel(cloudFood.estimateMethod),
      sourceLabel: cloudFood.sourceLabel,
      sourceUrl: cloudFood.sourceUrl,
      sourcePublishedOn: cloudFood.sourcePublishedOn,
    }));
  return [...mergedLocal, ...cloudOnly];
}

export function useCloudFoods() {
  const publishedMeals = trpc.publishedMeals.list.useQuery(undefined, { retry: 1, refetchOnWindowFocus: false });

  const foods = useMemo<Food[]>(() => mergeCloudFoods(localFoods, publishedMeals.data as CloudPublishedMeal[] | undefined), [publishedMeals.data]);

  return { foods, publishedMealsLoading: publishedMeals.isLoading, publishedMealsError: publishedMeals.error };
}
