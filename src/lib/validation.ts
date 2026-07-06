import { z } from "zod";

// Single source of truth for categories, shared by the form, the API,
// and analytics. Keep in sync with the Prisma `Category` enum.
export const CATEGORIES = [
  "BUG",
  "FEATURE",
  "IMPROVEMENT",
  "PRAISE",
  "OTHER",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  BUG: "Bug",
  FEATURE: "Feature request",
  IMPROVEMENT: "Improvement",
  PRAISE: "Praise",
  OTHER: "Other",
};

// Validates the public feedback submission payload.
export const feedbackSchema = z.object({
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Pick a category from the list." }),
  }),
  comment: z
    .string()
    .trim()
    .min(3, "Tell us a little more — at least 3 characters.")
    .max(2000, "Keep it under 2000 characters."),
  email: z
    .string()
    .trim()
    .email("That email doesn't look right.")
    .max(320)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

// Validates dashboard query params for fetching feedback.
export const feedbackQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type FeedbackQuery = z.infer<typeof feedbackQuerySchema>;
