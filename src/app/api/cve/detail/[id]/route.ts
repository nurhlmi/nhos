import { apiRoute } from "@/lib/api-route";
import { cveIdSchema } from "@/features/cve/schemas";
import { getCveDetail } from "@/services/nvd";

export const GET = apiRoute<{ id: string }>(async (_request, { params }) => {
  const result = await getCveDetail(cveIdSchema.parse(params.id));
  if (!result.data) throw Object.assign(new Error("CVE not found in NVD"), { status: 404 });
  return result;
});
