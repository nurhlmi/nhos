/** Times as the source publishes them: "HH:mm", local to the city. */
export type PrayerTimes = {
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
};

export type PrayerTimeKey = keyof PrayerTimes;

/** One day of the schedule. `date` is YYYY-MM-DD. */
export type PrayerDay = { date: string } & PrayerTimes;

export type PrayerCity = { id: string; name: string };

export type PrayerLocation = {
  id: string;
  city: string;
  province: string;
  /** IANA zone the published times are in (WIB, WITA or WIT). */
  timeZone: string;
  zoneLabel: "WIB" | "WITA" | "WIT";
};

export type PrayerToday = {
  location: PrayerLocation;
  today: PrayerDay;
  /** Needed to count down to Subuh after Isya. */
  tomorrow: PrayerDay | null;
};

export type PrayerMonth = {
  location: PrayerLocation;
  /** YYYY-MM */
  month: string;
  days: PrayerDay[];
};
