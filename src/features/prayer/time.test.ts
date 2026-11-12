import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCountdown, nextPrayer, zonedNow } from "./time.ts";
import type { PrayerDay } from "./types.ts";

const day = (date: string): PrayerDay => ({
  date,
  imsak: "03:56",
  subuh: "04:06",
  terbit: "05:22",
  dhuha: "05:50",
  dzuhur: "11:40",
  ashar: "15:00",
  maghrib: "17:51",
  isya: "19:04",
});
const today = day("2026-11-12");
const tomorrow = day("2026-11-13");

test("zonedNow reads the wall clock of the given zone", () => {
  const at = new Date("2026-11-12T16:30:00Z");
  assert.deepEqual(zonedNow(at, "Asia/Jakarta"), { date: "2026-11-12", minutes: 23 * 60 + 30, seconds: 0 });
  assert.equal(zonedNow(at, "Asia/Jayapura").date, "2026-11-13");
});

test("next prayer skips Terbit and Dhuha", () => {
  const next = nextPrayer(today, tomorrow, new Date("2026-11-12T00:00:00+07:00"), "Asia/Jakarta");
  assert.equal(next?.key, "subuh");
  const afterSubuh = nextPrayer(today, tomorrow, new Date("2026-11-12T05:00:00+07:00"), "Asia/Jakarta");
  assert.equal(afterSubuh?.key, "dzuhur");
  assert.equal(afterSubuh?.secondsLeft, (6 * 60 + 40) * 60);
});

test("after Isya it counts down to tomorrow's Subuh", () => {
  const next = nextPrayer(today, tomorrow, new Date("2026-11-12T20:00:00+07:00"), "Asia/Jakarta");
  assert.equal(next?.key, "subuh");
  assert.equal(next?.tomorrow, true);
  assert.equal(next?.secondsLeft, (8 * 60 + 6) * 60);
});

test("a page left open past midnight uses tomorrow's times", () => {
  const next = nextPrayer(today, tomorrow, new Date("2026-11-13T01:00:00+07:00"), "Asia/Jakarta");
  assert.equal(next?.key, "subuh");
  assert.equal(next?.tomorrow, false);
});

test("no schedule for the current date gives no countdown", () => {
  assert.equal(nextPrayer(today, null, new Date("2026-11-14T10:00:00+07:00"), "Asia/Jakarta"), null);
});

test("formatCountdown pads hours, minutes and seconds", () => {
  assert.equal(formatCountdown(3725), "01:02:05");
});
