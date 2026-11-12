import { apiRoute, searchParamsObject } from "@/lib/api-route";
import { stockHistoryQuerySchema } from "@/features/stocks/schemas";
import { getStockHistory } from "@/services/stocks";

export const GET = apiRoute(async (request) => {
  const { code, range } = stockHistoryQuerySchema.parse(searchParamsObject(request));
  return getStockHistory(code, range);
});
