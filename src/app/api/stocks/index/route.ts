import { apiRoute } from "@/lib/api-route";
import { getIndexSnapshot } from "@/services/stocks";

export const GET = apiRoute(async () => getIndexSnapshot());
