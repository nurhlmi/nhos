import { apiRoute, searchParamsObject } from "@/lib/api-route";
import { kevQuerySchema } from "@/features/cve/schemas";
import { getKev } from "@/services/kev";

export const GET = apiRoute(async (request) => {
  const { page, pageSize, q, ransomware } = kevQuerySchema.parse(searchParamsObject(request));
  const { index, meta } = await getKev();
  const term = q?.toLowerCase();
  const filtered = index.entries.filter(
    (e) =>
      (!ransomware || e.knownRansomwareCampaignUse === ransomware) &&
      (!term ||
        e.cveID.toLowerCase().includes(term) ||
        e.vendorProject.toLowerCase().includes(term) ||
        e.product.toLowerCase().includes(term) ||
        e.vulnerabilityName.toLowerCase().includes(term)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  return {
    data: {
      items: filtered.slice((current - 1) * pageSize, current * pageSize),
      page: current,
      pageSize,
      total: filtered.length,
      totalPages,
      catalogTotal: index.entries.length,
    },
    meta,
  };
});
