import { apiRoute, searchParamsObject } from "@/lib/api-route";
import { goldHistoryQuerySchema } from "@/features/gold/schemas";
import { getGoldHistory } from "@/services/gold";

export const GET = apiRoute(async (request) => {
  const { type, weight, range } = goldHistoryQuerySchema.parse(searchParamsObject(request));
  return getGoldHistory(type, weight, range);
});
