import { Food, foods as localFoods } from "@/lib/foodDatabase";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export function useCloudFoods() {
  const publishedMeals = trpc.publishedMeals.list.useQuery(undefined, { retry: 1, refetchOnWindowFocus: false });

  const foods = useMemo<Food[]>(() => {
    if (!publishedMeals.data) return localFoods;
    return localFoods.map((localFood) => {
      const cloudFood = publishedMeals.data.find((record) => record.slug === localFood.id || record.name === localFood.name);
      if (!cloudFood) return localFood;
      return {
        ...localFood,
        carbonScore: cloudFood.carbonScore,
        category: cloudFood.category,
        factors: cloudFood.factors,
        estimateMethod: "Published meal research",
      };
    });
  }, [publishedMeals.data]);

  return { foods, publishedMealsLoading: publishedMeals.isLoading, publishedMealsError: publishedMeals.error };
}
