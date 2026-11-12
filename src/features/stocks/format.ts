import { formatNumber } from "@/utils/format";

/** IDX prices are whole Rupiah; index values keep two decimals. */
export const formatPrice = (value: number | null) => (value === null ? "n/a" : formatNumber(value, 0));

export const formatIndex = (value: number | null) =>
  value === null ? "n/a" : new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

/** Absolute change with a sign, e.g. +25 or -12.50. */
export const formatSigned = (value: number | null, digits = 0) =>
  value === null ? "n/a" : `${value > 0 ? "+" : ""}${formatNumber(value, digits)}`;
