import type { PrayerLocation, PrayerTimeKey } from "./types.ts";

/** KOTA JAKARTA in the myQuran (Kemenag) city list. */
export const DEFAULT_CITY_ID = "58a2fc6ed39fd083f55d4182bf88826d";

export const CITY_STORAGE_KEY = "nhos:prayer-city";

/** Every time the source publishes, in the order of the day. */
export const PRAYER_TIMES: { key: PrayerTimeKey; label: string; obligatory: boolean }[] = [
  { key: "imsak", label: "Imsak", obligatory: false },
  { key: "subuh", label: "Subuh", obligatory: true },
  { key: "terbit", label: "Terbit", obligatory: false },
  { key: "dhuha", label: "Dhuha", obligatory: false },
  { key: "dzuhur", label: "Dzuhur", obligatory: true },
  { key: "ashar", label: "Ashar", obligatory: true },
  { key: "maghrib", label: "Maghrib", obligatory: true },
  { key: "isya", label: "Isya", obligatory: true },
];

const WITA = ["BALI", "NUSA TENGGARA", "KALIMANTAN SELATAN", "KALIMANTAN TIMUR", "KALIMANTAN UTARA", "SULAWESI", "GORONTALO"];
const WIT = ["MALUKU", "PAPUA"];

/** Indonesia's three zones, by province name as the source spells it. */
export function zoneForProvince(province: string): Pick<PrayerLocation, "timeZone" | "zoneLabel"> {
  const p = province.toUpperCase();
  if (WIT.some((w) => p.includes(w))) return { timeZone: "Asia/Jayapura", zoneLabel: "WIT" };
  if (WITA.some((w) => p.includes(w))) return { timeZone: "Asia/Makassar", zoneLabel: "WITA" };
  return { timeZone: "Asia/Jakarta", zoneLabel: "WIB" };
}
