"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export type TypedSupabaseClient = SupabaseClient<Database>;

let browserClient: TypedSupabaseClient | undefined;

export function getSupabaseBrowserClient(): TypedSupabaseClient {
  if (!browserClient) {
    const { supabaseUrl, supabaseKey } = getPublicEnv();
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseKey);
  }
  return browserClient;
}
