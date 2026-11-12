import { apiRoute } from "@/lib/api-route";
import { getPrayerCities } from "@/services/prayer";

export const GET = apiRoute(async () => getPrayerCities());
