import {
  LayoutDashboard,
  ArrowLeftRight,
  Coins,
  ChartCandlestick,
  Clock,
  CalendarDays,
  Clapperboard,
  Boxes,
  ShieldExclamationPoint,
  Newspaper,
  FileUser,
  Settings,
  Activity,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export type NavGroup = {
  /** Shown above the group in the expanded sidebar; omitted for the top entry. */
  label?: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    items: [{ title: "Overview", href: "/", icon: LayoutDashboard, description: "Summary of everything that matters today" }],
  },
  {
    label: "Markets",
    items: [
      { title: "Currency Exchange", href: "/currency", icon: ArrowLeftRight, description: "Exchange rates, converter and history" },
      { title: "Gold Prices", href: "/gold", icon: Coins, description: "Galeri 24 gold selling and buyback prices" },
      { title: "Indonesian Stocks", href: "/stocks", icon: ChartCandlestick, description: "IHSG, IDX watchlist and price history" },
    ],
  },
  {
    label: "Daily",
    items: [
      { title: "Prayer Times", href: "/prayer", icon: Clock, description: "Jadwal sholat for your city" },
      { title: "Public Holidays", href: "/holidays", icon: CalendarDays, description: "Tanggal merah and cuti bersama" },
      { title: "Movies", href: "/movies", icon: Clapperboard, description: "Now showing and coming soon in Indonesia" },
    ],
  },
  {
    label: "Tech",
    items: [
      { title: "CVE Monitoring", href: "/cve", icon: ShieldExclamationPoint, description: "Vulnerabilities from NVD and CISA KEV" },
      { title: "Technology News", href: "/news", icon: Newspaper, description: "Curated feeds from tech publishers" },
    ],
  },
  {
    label: "Personal",
    items: [
      { title: "Asset Management", href: "/assets", icon: Boxes, description: "Personal assets and purchase details" },
      { title: "CV Builder", href: "/cv", icon: FileUser, description: "Professional profile and CV versions" },
    ],
  },
  {
    label: "System",
    items: [
      // Activity: a pulse trace, matching a health check of upstream APIs.
      { title: "API Monitoring", href: "/monitoring", icon: Activity, description: "Status of every external API in use" },
    ],
  },
];

export const mainNav: NavItem[] = navGroups.flatMap((g) => g.items);

export const secondaryNav: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings, description: "Profile, appearance and dashboard" },
];

export const allNav = [...mainNav, ...secondaryNav];

/** Labels for nested route segments used in breadcrumbs. */
export const segmentLabels: Record<string, string> = {
  currency: "Currency Exchange",
  gold: "Gold Prices",
  stocks: "Indonesian Stocks",
  prayer: "Prayer Times",
  holidays: "Public Holidays",
  movies: "Movies",
  assets: "Asset Management",
  cve: "CVE Monitoring",
  news: "Technology News",
  cv: "CV Builder",
  settings: "Settings",
  monitoring: "API Monitoring",
  new: "New",
  edit: "Edit",
  saved: "Saved Articles",
  watchlist: "Watchlist",
  kev: "Known Exploited",
  builder: "Builder",
};

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
