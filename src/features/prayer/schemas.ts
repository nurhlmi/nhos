import { z } from "zod";

const cityId = z.string().trim().regex(/^[a-f0-9]{32}$/, "Unknown city");

export const prayerTodayQuerySchema = z.object({ city: cityId });

export const prayerMonthQuerySchema = z.object({
  city: cityId,
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM"),
});
