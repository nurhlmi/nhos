import { Badge } from "@/components/ui/badge";
import type { HolidayType } from "@/features/holidays/types";

export function HolidayTypeBadge({ type }: { type: HolidayType }) {
  // Red marks the official red date, as on an Indonesian wall calendar; cuti bersama stays neutral.
  return type === "holiday" ? <Badge variant="destructive">Public holiday</Badge> : <Badge variant="secondary">Cuti bersama</Badge>;
}
