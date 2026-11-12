/** "holiday" is a national public holiday, "leave" a collective leave day (cuti bersama). */
export type HolidayType = "holiday" | "leave";

/** `date` is YYYY-MM-DD. `name` is the official Indonesian name. */
export type Holiday = { date: string; name: string; type: HolidayType };

export type HolidayYear = {
  year: number;
  holidays: Holiday[];
  /** Years the source has published, ascending. */
  years: number[];
};
