"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false during SSR and hydration, true afterwards. For client-only values like the theme. */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
