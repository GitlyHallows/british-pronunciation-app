import { requireAuthForRoute } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDownloadUrl } from "@/lib/s3";
import { fail, handleRouteError, ok } from "@/lib/http";

export async function GET(_: Request, { params }: { params: Promise<{ recordingId: string }> }) {
  try {
    const { recordingId } = await params;
    const auth = await requireAuthForRoute();
    const supabase = await createSupabaseServerClient();

    const { data: recording, error } = await supabase
      .from("recordings")
      .select("id, s3_key")
      .eq("id", recordingId)
      .eq("user_id", auth.userId)
      .single();

    if (error || !recording) {
      return fail("Recording not found", 404);
    }

    const { downloadUrl } = await createDownloadUrl({ key: recording.s3_key });
    return ok({ downloadUrl });
  } catch (error) {
    return handleRouteError(error);
  }
}
