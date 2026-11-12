import { Boxes, CalendarDays, Coins, Shapes } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency, formatDate } from "@/utils/format";
import type { AssetRow } from "@/types/database";
import { isHeld, type AssetTotals } from "@/features/assets/hooks";

export function AssetStats({ totals, assets }: { totals: AssetTotals; assets: AssetRow[] }) {
  const held = assets.filter(isHeld);
  const categories = new Set(held.map((a) => a.category)).size;
  const latest = [...assets].sort((a, b) => b.purchase_date.localeCompare(a.purchase_date))[0];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Total acquisition cost"
        value={formatCurrency(totals.acquisitionCost)}
        icon={Coins}
        tone="primary"
        hint="Assets currently held"
      />
      <StatCard label="Total assets" value={totals.totalAssets.toLocaleString("en-US")} icon={Boxes} hint={`${totals.activeAssets} active`} />
      <StatCard label="Categories" value={categories.toLocaleString("en-US")} icon={Shapes} hint="Among assets held" />
      <StatCard
        label="Latest purchase"
        value={latest ? formatDate(latest.purchase_date) : "None yet"}
        icon={CalendarDays}
        hint={latest ? latest.name : "Add your first asset"}
      />
    </div>
  );
}
