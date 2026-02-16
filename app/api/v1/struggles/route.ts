import { z } from "zod";
import { requireAuthForRoute } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, handleRouteError, ok } from "@/lib/http";

const createStruggleSchema = z.object({
  title: z.string().min(3).max(180),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(["active", "archived"]).default("active")
});

export async function GET() {
  try {
    const auth = await requireAuthForRoute();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("struggles")
      .select("*")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return ok(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthForRoute();
    const body = await request.json();
    const parsed = createStruggleSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const supabase = await createSupabaseServerClient();
    const payload = parsed.data;

    const { data, error } = await supabase
      .from("struggles")
      .insert({
        user_id: auth.userId,
        title: payload.title,
        description: payload.description ?? null,
        status: payload.status
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return ok(data, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
