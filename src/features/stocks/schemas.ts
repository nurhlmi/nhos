import { z } from "zod";
import { STOCK_RANGES } from "@/features/stocks/types";

const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{2,20}$/, "Unknown stock code");

export const stockHistoryQuerySchema = z.object({
  code,
  range: z.enum(STOCK_RANGES).default("3M"),
});

export const stockQuotesQuerySchema = z.object({
  codes: z
    .string()
    .trim()
    .transform((s) => [...new Set(s.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean))])
    .pipe(z.array(code).min(1, "Choose at least one stock").max(10, "At most 10 stocks per request")),
});
