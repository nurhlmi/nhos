import { apiRoute, searchParamsObject } from "@/lib/api-route";
import { prayerTodayQuerySchema } from "@/features/prayer/schemas";
import { getPrayerToday } from "@/services/prayer";

export const GET = apiRoute(async (request) => {
  const { city } = prayerTodayQuerySchema.parse(searchParamsObject(request));
  return getPrayerToday(city);
});
