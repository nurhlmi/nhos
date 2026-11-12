import { apiRoute } from "@/lib/api-route";
import { getCurrencies } from "@/services/currency";

export const GET = apiRoute(async () => getCurrencies());
