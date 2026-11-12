"use client";

import { useEffect, useState } from "react";

/**
 * Current time, updated every `intervalMs`. Returns null until mounted so
 * server and client markup match (no hydration mismatch on the clock).
 */
export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the clock on mount
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
