import { PRAYER_TIMES } from "./constants.ts";
import type { PrayerDay, PrayerTimeKey } from "./types.ts";

/** Wall-clock date and minutes since midnight in a zone, independent of the browser's zone. */
export function zonedNow(now: Date, timeZone: string): { date: string; minutes: number; seconds: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    seconds: Number(parts.second),
  };
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export type NextPrayer = { key: PrayerTimeKey; label: string; time: string; secondsLeft: number; tomorrow: boolean };

/** The next of the five daily prayers after `now`, rolling over to tomorrow's Subuh after Isya. */
export function nextPrayer(today: PrayerDay, tomorrow: PrayerDay | null, now: Date, timeZone: string): NextPrayer | null {
  const local = zonedNow(now, timeZone);
  const nowSeconds = local.minutes * 60 + local.seconds;
  // A page left open past midnight treats tomorrow as today until it refetches.
  const days = local.date === today.date ? [today, tomorrow] : local.date === tomorrow?.date ? [tomorrow] : [];

  for (const [offset, day] of days.entries()) {
    if (!day) continue;
    for (const p of PRAYER_TIMES) {
      if (!p.obligatory) continue;
      const at = toMinutes(day[p.key]) * 60 + offset * 24 * 3600;
      if (at > nowSeconds) return { key: p.key, label: p.label, time: day[p.key], secondsLeft: at - nowSeconds, tomorrow: offset > 0 };
    }
  }
  return null;
}

export function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
