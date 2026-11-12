import { z } from "zod";
import { HISTORY_RANGES } from "@/features/currency/types";

export const currencyCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Use a 3-letter ISO currency code");

export const pairSchema = z
  .object({ base: currencyCode, quote: currencyCode })
  .refine((p) => p.base !== p.quote, { message: "Base and quote must differ", path: ["quote"] });

export const pairsQuerySchema = z
  .string()
  .transform((s) => s.split(",").filter(Boolean))
  .pipe(
    z
      .array(
        z
          .string()
          .regex(/^[A-Za-z]{3}-[A-Za-z]{3}$/)
          .transform((p) => {
            const [base, quote] = p.toUpperCase().split("-");
            return { base: base!, quote: quote! };
          })
          .refine((p) => p.base !== p.quote, { message: "Base and quote must differ" }),
      )
      .min(1)
      .max(30),
  );

export const historyQuerySchema = z.object({
  base: currencyCode,
  quote: currencyCode,
  range: z.enum(HISTORY_RANGES).default("1M"),
});

export const convertQuerySchema = z.object({
  from: currencyCode,
  to: currencyCode,
  amount: z.coerce.number().finite().min(0).max(1e15),
});

export const converterFormSchema = z.object({
  amount: z.number({ error: "Enter an amount" }).min(0, "Amount must be positive").max(1e15),
  from: currencyCode,
  to: currencyCode,
});

export type ConverterFormValues = z.infer<typeof converterFormSchema>;
