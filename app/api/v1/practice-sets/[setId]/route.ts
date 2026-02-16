import { z } from "zod";
import { requireAuthForRoute } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, handleRouteError, ok } from "@/lib/http";

const updateSetSchema = z.object({
  title: z.string().min(2).max(180).optional(),
  source: z.string().min(2).max(80).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ setId: string }> }) {
  try {
    const { setId } = await params;
    const auth = await requireAuthForRoute();
    const body = await request.json();
    const parsed = updateSetSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("practice_sets")
      .update(parsed.data)
      .eq("id", setId)
      .eq("user_id", auth.userId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ setId: string }> }) {
  try {
    const { setId } = await params;
    const auth = await requireAuthForRoute();
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("practice_sets").delete().eq("id", setId).eq("user_id", auth.userId);

    if (error) {
      throw error;
    }

    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
