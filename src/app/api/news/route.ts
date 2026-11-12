import { apiRoute } from "@/lib/api-route";
import { getNews } from "@/services/news";

export const GET = apiRoute(async () => getNews());
