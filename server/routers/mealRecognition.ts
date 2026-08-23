import { z } from "zod";
import { recogniseMealPhoto } from "../mealRecognition";
import { protectedProcedure, router } from "../_core/trpc";

const dataImage = z.string().max(8_000_000).refine(
  (value) => /^data:image\/(jpeg|jpg|png|webp);base64,/.test(value),
  "Please use a JPG, PNG, or WebP meal photo.",
);

export const mealRecognitionRouter = router({
  scan: protectedProcedure.input(z.object({ imageDataUrl: dataImage })).mutation(async ({ input }) => {
    return recogniseMealPhoto(input.imageDataUrl);
  }),
});
