import { apiRoute, searchParamsObject } from "@/lib/api-route";
import { stockQuotesQuerySchema } from "@/features/stocks/schemas";
import { getStockQuotes } from "@/services/stocks";

export const GET = apiRoute(async (request) => {
  const { codes } = stockQuotesQuerySchema.parse(searchParamsObject(request));
  return getStockQuotes(codes);
});
