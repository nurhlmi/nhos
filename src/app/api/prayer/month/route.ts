import { apiRoute, searchParamsObject } from "@/lib/api-route";
import { prayerMonthQuerySchema } from "@/features/prayer/schemas";
import { getPrayerMonth } from "@/services/prayer";

export const GET = apiRoute(async (request) => {
  const { city, month } = prayerMonthQuerySchema.parse(searchParamsObject(request));
  return getPrayerMonth(city, month);
});
