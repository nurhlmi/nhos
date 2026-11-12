import { apiRoute, searchParamsObject } from "@/lib/api-route";
import { holidaysQuerySchema } from "@/features/holidays/schemas";
import { getHolidays } from "@/services/holidays";

export const GET = apiRoute(async (request) => {
  const { year } = holidaysQuerySchema.parse(searchParamsObject(request));
  return getHolidays(year);
});
