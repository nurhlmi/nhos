import { apiRoute } from "@/lib/api-route";
import { pairsQuerySchema } from "@/features/currency/schemas";
import { getPairQuotes } from "@/services/currency";

export const GET = apiRoute(async (request) => {
  const pairs = pairsQuerySchema.parse(request.nextUrl.searchParams.get("pairs") ?? "");
  return getPairQuotes(pairs);
});
