import { listPublishedMeals } from "../db";
import { publicProcedure, router } from "../_core/trpc";

export const publishedMealsRouter = router({
  list: publicProcedure.query(async () => {
    const records = await listPublishedMeals();
    return records.map((record) => ({
      id: record.id,
      slug: record.slug,
      name: record.name,
      carbonScore: record.carbonHundredths / 100,
      category: record.category,
      estimateMethod: record.estimateMethod,
      sourceLabel: record.sourceLabel,
      sourceUrl: record.sourceUrl,
      sourcePublishedOn: record.sourcePublishedOn,
      factors: JSON.parse(record.factorsJson) as string[],
    }));
  }),
});
