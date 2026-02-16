import { z } from "zod";
import { requireAuthForRoute } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, handleRouteError, ok } from "@/lib/http";
import { toLondonDateBucket } from "@/lib/time";

const querySchema = z.object({
  section_type: z.enum(["struggle", "misc"]).optional(),
  struggle_id: z.string().uuid().optional()
});

const createSetSchema = z.object({
  section_type: z.enum(["struggle", "misc"]),
  struggle_id: z.string().uuid().optional().nullable(),
  date: z.string().optional(),
  set_index: z.number().int().positive().optional(),
  title: z.string().min(2).max(180),
  source: z.string().min(2).max(80).default("manual")
});

export async function GET(request: Request) {
  try {
    const auth = await requireAuthForRoute();
    const url = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      section_type: url.searchParams.get("section_type") ?? undefined,
      struggle_id: url.searchParams.get("struggle_id") ?? undefined
    });

    if (!parsedQuery.success) {
      return fail("Invalid query", 400, parsedQuery.error.flatten());
    }

    const supabase = await createSupabaseServerClient();
    let query = supabase.from("practice_sets").select("*").eq("user_id", auth.userId);

    if (parsedQuery.data.section_type) {
      query = query.eq("section_type", parsedQuery.data.section_type);
    }

    if (parsedQuery.data.struggle_id) {
      query = query.eq("struggle_id", parsedQuery.data.struggle_id);
    }

    const { data, error } = await query
      .order("date_bucket_london", { ascending: false })
      .order("set_index", { ascending: true });

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
    const parsed = createSetSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const supabase = await createSupabaseServerClient();
    const payload = parsed.data;
    const dateBucket = toLondonDateBucket(payload.date ?? new Date().toISOString());

    let setIndex = payload.set_index ?? 0;
    if (!setIndex) {
      let latestSetQuery = supabase
        .from("practice_sets")
        .select("set_index")
        .eq("user_id", auth.userId)
        .eq("section_type", payload.section_type)
        .eq("date_bucket_london", dateBucket)
        .order("set_index", { ascending: false })
        .limit(1);

      latestSetQuery = payload.struggle_id
        ? latestSetQuery.eq("struggle_id", payload.struggle_id)
        : latestSetQuery.is("struggle_id", null);

      const { data: latestSet, error: latestSetError } = await latestSetQuery.maybeSingle();

      if (latestSetError) {
        throw latestSetError;
      }

      setIndex = (latestSet?.set_index ?? 0) + 1;
    }

    const { data, error } = await supabase
      .from("practice_sets")
      .insert({
        user_id: auth.userId,
        section_type: payload.section_type,
        struggle_id: payload.struggle_id ?? null,
        date_bucket_london: dateBucket,
        set_index: setIndex,
        title: payload.title,
        source: payload.source
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
