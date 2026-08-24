import { z } from "zod";
import { listHiddenCommunityPostIds, listModerationAudit, listOpenModerationCases, ModerationAction, ModerationReason, reportCommunityPost, resolveModerationCase } from "../db";
import { protectedProcedure, publicProcedure, router, teacherProcedure } from "../_core/trpc";

const moderationReason = z.enum(["private_information", "unkind_or_harmful", "off_topic", "safety_concern", "other"]);
const moderationAction = z.enum(["restored", "hidden", "removed"]);

const reportInput = z.object({
  postClientId: z.string().min(1).max(96),
  displayName: z.string().min(1).max(40),
  mealsLogged: z.number().int().min(0).max(70),
  weeklyFootprintHundredths: z.number().int().min(0).max(50000),
  message: z.string().min(1).max(180),
});

export const moderationRouter = router({
  hiddenPostIds: publicProcedure.query(async () => listHiddenCommunityPostIds()),
  report: protectedProcedure.input(reportInput).mutation(async ({ ctx, input }) => {
    await reportCommunityPost(ctx.user.id, input);
    return { success: true } as const;
  }),
  openCases: teacherProcedure.query(async () => listOpenModerationCases()),
  auditHistory: teacherProcedure.query(async () => listModerationAudit()),
  resolve: teacherProcedure.input(z.object({
    moderationCaseId: z.number().int().positive(),
    action: moderationAction,
    reason: moderationReason,
  })).mutation(async ({ ctx, input }) => ({
    success: await resolveModerationCase(ctx.user.id, input.moderationCaseId, input.action as ModerationAction, input.reason as ModerationReason),
  })),
});
