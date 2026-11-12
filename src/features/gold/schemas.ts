import { z } from "zod";
import { GOLD_RANGES } from "@/features/gold/types";

export const goldHistoryQuerySchema = z.object({
  type: z
    .string()
    .trim()
    .min(1, "Choose a product type")
    .max(60)
    .regex(/^[A-Za-z0-9 .&'-]+$/, "Unknown product type"),
  weight: z.coerce.number().finite().positive("Weight must be positive").max(100_000),
  range: z.enum(GOLD_RANGES).default("1M"),
});
