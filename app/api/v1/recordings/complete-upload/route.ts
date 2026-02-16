import { z } from "zod";
import { requireAuthForRoute } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, handleRouteError, ok } from "@/lib/http";
import { toLondonDateBucket } from "@/lib/time";

const schema = z.object({
  key: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  bytes: z.number().int().positive(),
  description: z.string().max(2000).optional().default(""),
  speakingWith: z.string().max(240).optional().default(""),
  recordedAt: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuthForRoute();
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const recordedAtDate = parsed.data.recordedAt ? new Date(parsed.data.recordedAt) : new Date();
    if (Number.isNaN(recordedAtDate.getTime())) {
      return fail("Invalid recordedAt datetime", 400);
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("recordings")
      .insert({
        user_id: auth.userId,
        recorded_at: recordedAtDate.toISOString(),
        date_bucket_london: toLondonDateBucket(recordedAtDate),
        description: parsed.data.description,
        speaking_with: parsed.data.speakingWith,
        duration_sec: null,
        s3_key: parsed.data.key,
        file_name: parsed.data.fileName,
        mime_type: parsed.data.mimeType,
        bytes: parsed.data.bytes
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
