import { apiRoute } from "@/lib/api-route";
import { getGoldBoard } from "@/services/gold";

export const GET = apiRoute(async () => getGoldBoard());
