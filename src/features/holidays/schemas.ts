import { z } from "zod";

export const holidaysQuerySchema = z.object({
  year: z.coerce.number({ error: "Year must be a number" }).int().min(2000, "Year is out of range").max(2100, "Year is out of range"),
});
