import { apiRoute } from "@/lib/api-route";
import { getCveOverview } from "@/services/nvd";

export const GET = apiRoute(async () => getCveOverview());
