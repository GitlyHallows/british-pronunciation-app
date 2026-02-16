import { z } from "zod";
import { requireAuthForRoute } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, handleRouteError, ok } from "@/lib/http";

const updateSchema = z.object({
  title: z.string().min(3).max(180).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(["active", "archived"]).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuthForRoute();
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("struggles")
      .update(parsed.data)
      .eq("id", id)
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

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuthForRoute();
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("struggles").delete().eq("id", id).eq("user_id", auth.userId);

    if (error) {
      throw error;
    }

    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
