"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!client) {
    const env = getSupabasePublicEnv();
    client = createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return client;
}
