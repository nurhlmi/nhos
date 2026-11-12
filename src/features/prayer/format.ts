const ACRONYMS = new Set(["DKI", "DI"]);

/** "KAB. ACEH BARAT" -> "Kab. Aceh Barat", keeping "DKI Jakarta" and "DI Yogyakarta" intact. */
export function titleCase(name: string) {
  return name
    .split(" ")
    .map((w) => (ACRONYMS.has(w) ? w : w.charAt(0) + w.slice(1).toLowerCase()))
    .join(" ");
}
