import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getSupabasePublicEnv();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // In Server Components this can be read-only; middleware/route handlers refresh cookies.
        }
      }
    }
  });
}
