import { apiRoute, searchParamsObject } from "@/lib/api-route";
import { convertQuerySchema } from "@/features/currency/schemas";
import { convert } from "@/services/currency";

export const GET = apiRoute(async (request) => {
  const { from, to, amount } = convertQuerySchema.parse(searchParamsObject(request));
  return convert(from, to, amount);
});
