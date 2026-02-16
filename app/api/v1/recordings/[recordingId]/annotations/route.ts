import { z } from "zod";
import { requireAuthForRoute } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, handleRouteError, ok } from "@/lib/http";

const createSchema = z.object({
  startSec: z.number().nonnegative(),
  endSec: z.number().positive(),
  color: z.enum(["red", "green"]),
  comment: z.string().min(1).max(2000)
});

const updateSchema = z.object({
  startSec: z.number().nonnegative().optional(),
  endSec: z.number().positive().optional(),
  color: z.enum(["red", "green"]).optional(),
  comment: z.string().min(1).max(2000).optional()
});

async function ensureRecordingOwnership(recordingId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recordings")
    .select("id")
    .eq("id", recordingId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("NOT_FOUND");
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ recordingId: string }> }) {
  try {
    const { recordingId } = await params;
    const auth = await requireAuthForRoute();
    await ensureRecordingOwnership(recordingId, auth.userId);

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("recording_annotations")
      .select("*")
      .eq("recording_id", recordingId)
      .order("start_sec", { ascending: true });

    if (error) {
      throw error;
    }

    return ok(data ?? []);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return fail("Recording not found", 404);
    }
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ recordingId: string }> }) {
  try {
    const { recordingId } = await params;
    const auth = await requireAuthForRoute();
    await ensureRecordingOwnership(recordingId, auth.userId);

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    if (parsed.data.endSec <= parsed.data.startSec) {
      return fail("endSec must be greater than startSec", 400);
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("recording_annotations")
      .insert({
        recording_id: recordingId,
        start_sec: parsed.data.startSec,
        end_sec: parsed.data.endSec,
        color: parsed.data.color,
        comment: parsed.data.comment
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return ok(data, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return fail("Recording not found", 404);
    }
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ recordingId: string }> }) {
  try {
    const { recordingId } = await params;
    const auth = await requireAuthForRoute();
    await ensureRecordingOwnership(recordingId, auth.userId);

    const url = new URL(request.url);
    const annotationId = url.searchParams.get("annotationId");
    if (!annotationId) {
      return fail("annotationId query parameter is required", 400);
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const supabase = await createSupabaseServerClient();
    const payload: Record<string, unknown> = {};

    if (parsed.data.startSec !== undefined) payload.start_sec = parsed.data.startSec;
    if (parsed.data.endSec !== undefined) payload.end_sec = parsed.data.endSec;
    if (parsed.data.color !== undefined) payload.color = parsed.data.color;
    if (parsed.data.comment !== undefined) payload.comment = parsed.data.comment;

    const { data, error } = await supabase
      .from("recording_annotations")
      .update(payload)
      .eq("id", annotationId)
      .eq("recording_id", recordingId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return ok(data);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return fail("Recording not found", 404);
    }
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ recordingId: string }> }) {
  try {
    const { recordingId } = await params;
    const auth = await requireAuthForRoute();
    await ensureRecordingOwnership(recordingId, auth.userId);

    const url = new URL(request.url);
    const annotationId = url.searchParams.get("annotationId");
    if (!annotationId) {
      return fail("annotationId query parameter is required", 400);
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("recording_annotations")
      .delete()
      .eq("id", annotationId)
      .eq("recording_id", recordingId);

    if (error) {
      throw error;
    }

    return ok({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return fail("Recording not found", 404);
    }
    return handleRouteError(error);
  }
}
