import { apiRoute, searchParamsObject } from "@/lib/api-route";
import { historyQuerySchema } from "@/features/currency/schemas";
import { getPairHistory } from "@/services/currency";

export const GET = apiRoute(async (request) => {
  const { base, quote, range } = historyQuerySchema.parse(searchParamsObject(request));
  return getPairHistory(base, quote, range);
});
