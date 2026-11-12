import { formatCurrency, formatNumber } from "@/utils/format";

export const formatWeight = (grams: number) => `${formatNumber(grams, 2)} g`;

export const formatIdr = (value: number | null) => (value === null ? "n/a" : formatCurrency(value));

export const formatIdrCompact = (value: number) =>
  formatCurrency(value, "IDR", { notation: "compact", maximumFractionDigits: 2 });
