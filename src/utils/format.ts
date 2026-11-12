import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

export function formatCurrency(value: number, currency = "IDR", options: Intl.NumberFormatOptions = {}) {
  const maxFrac = currency === "IDR" || currency === "JPY" || currency === "KRW" ? 0 : 2;
  // Rupiah reads naturally in Indonesian notation: Rp 5.000.000
  return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
    ...options,
  }).format(value);
}

/** Exchange-rate formatting: keep significant digits for small rates. */
export function formatRate(value: number) {
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: abs >= 1000 ? 0 : 2 }).format(value);
}

export function formatNumber(value: number, maxFrac = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFrac }).format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatPercent(value: number, digits = 2) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : null;
}

export function formatDate(value: string | Date | null | undefined, pattern = "dd MMM yyyy") {
  const d = toDate(value);
  return d ? format(d, pattern) : "Unknown";
}

export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, "dd MMM yyyy, HH:mm");
}

export function formatRelative(value: string | Date | null | undefined) {
  const d = toDate(value);
  return d ? `${formatDistanceToNowStrict(d)} ago` : "Unknown";
}
