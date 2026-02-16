import { z } from "zod";
import { requireAuthForRoute } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, handleRouteError, ok } from "@/lib/http";
import { toLondonDateBucket } from "@/lib/time";

const updateSchema = z.object({
  description: z.string().max(2000).optional(),
  speakingWith: z.string().max(240).optional(),
  recordedAt: z.string().optional(),
  durationSec: z.number().nonnegative().optional().nullable()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ recordingId: string }> }) {
  try {
    const { recordingId } = await params;
    const auth = await requireAuthForRoute();
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const payload: Record<string, unknown> = {};
    if (parsed.data.description !== undefined) payload.description = parsed.data.description;
    if (parsed.data.speakingWith !== undefined) payload.speaking_with = parsed.data.speakingWith;
    if (parsed.data.durationSec !== undefined) payload.duration_sec = parsed.data.durationSec;
    if (parsed.data.recordedAt !== undefined) {
      const parsedDate = new Date(parsed.data.recordedAt);
      if (Number.isNaN(parsedDate.getTime())) {
        return fail("Invalid recordedAt", 400);
      }
      payload.recorded_at = parsedDate.toISOString();
      payload.date_bucket_london = toLondonDateBucket(parsedDate);
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("recordings")
      .update(payload)
      .eq("id", recordingId)
      .eq("user_id", auth.userId)
      .select("*")
      .single();

    if (error) throw error;
    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ recordingId: string }> }) {
  try {
    const { recordingId } = await params;
    const auth = await requireAuthForRoute();
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("recordings").delete().eq("id", recordingId).eq("user_id", auth.userId);
    if (error) throw error;

    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
