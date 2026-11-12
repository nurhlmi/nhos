import { apiRoute, searchParamsObject } from "@/lib/api-route";
import { cveSearchSchema } from "@/features/cve/schemas";
import { searchCves } from "@/services/nvd";

export const GET = apiRoute(async (request) => searchCves(cveSearchSchema.parse(searchParamsObject(request))));
