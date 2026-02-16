import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerEnv } from "@/lib/env";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  if (!adminClient) {
    const env = getSupabaseServerEnv();
    adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return adminClient;
}
