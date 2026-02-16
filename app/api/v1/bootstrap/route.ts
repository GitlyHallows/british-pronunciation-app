import { requireAuthForRoute } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ok, handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const auth = await requireAuthForRoute();
    const supabase = await createSupabaseServerClient();

    const [strugglesRes, setsRes, recordingsRes] = await Promise.all([
      supabase.from("struggles").select("id", { count: "exact", head: true }).eq("user_id", auth.userId),
      supabase.from("practice_sets").select("id", { count: "exact", head: true }).eq("user_id", auth.userId),
      supabase.from("recordings").select("id", { count: "exact", head: true }).eq("user_id", auth.userId)
    ]);

    return ok({
      userId: auth.userId,
      email: auth.email,
      counts: {
        struggles: strugglesRes.count ?? 0,
        sets: setsRes.count ?? 0,
        recordings: recordingsRes.count ?? 0
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
