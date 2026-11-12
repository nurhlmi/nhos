import { apiRoute } from "@/lib/api-route";
import { getApiMonitorReport } from "@/services/api-monitor";

export const GET = apiRoute(async (request) => {
  return getApiMonitorReport({ force: request.nextUrl.searchParams.get("refresh") === "1" });
});
