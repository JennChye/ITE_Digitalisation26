import { z } from "zod";
import { clearUserMealLogsForDate, deleteUserMealLog, listUserMealLogs, listUserTopMeals, updateUserMealLogServings, upsertUserMealLog } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const cloudMealInput = z.object({
  clientLogId: z.string().min(1).max(96),
  mealSlug: z.string().min(1).max(128),
  mealName: z.string().min(1).max(255),
  carbonHundredths: z.number().int().min(0).max(100000),
  servings: z.number().int().min(1).max(20),
  category: z.enum(["Vegetarian", "Non Vegetarian"]),
  entryMethod: z.enum(["camera", "manual", "custom"]),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  loggedAt: z.date(),
});

export const mealHistoryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => listUserMealLogs(ctx.user.id)),
  topFive: protectedProcedure.query(async ({ ctx }) => listUserTopMeals(ctx.user.id)),
  upsert: protectedProcedure.input(cloudMealInput).mutation(async ({ ctx, input }) => {
    await upsertUserMealLog(ctx.user.id, input);
    return { success: true } as const;
  }),
  import: protectedProcedure.input(z.array(cloudMealInput).max(200)).mutation(async ({ ctx, input }) => {
    for (const entry of input) await upsertUserMealLog(ctx.user.id, entry);
    return { imported: input.length } as const;
  }),
  updateServings: protectedProcedure.input(z.object({ id: z.number().int().positive(), servings: z.number().int().min(1).max(20) })).mutation(async ({ ctx, input }) => ({
    success: await updateUserMealLogServings(ctx.user.id, input.id, input.servings),
  })),
  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => ({
    success: await deleteUserMealLog(ctx.user.id, input.id),
  })),
  clearDate: protectedProcedure.input(z.object({ localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).mutation(async ({ ctx, input }) => {
    await clearUserMealLogsForDate(ctx.user.id, input.localDate);
    return { success: true } as const;
  }),
});
