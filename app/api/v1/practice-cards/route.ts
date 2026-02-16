import { z } from "zod";
import { requireAuthForRoute } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, handleRouteError, ok } from "@/lib/http";

const schema = z.object({
  set_id: z.string().uuid(),
  order_index: z.number().int().nonnegative(),
  sentence: z.string().min(1),
  ipa: z.string().min(1),
  stress_map: z.string().min(1),
  intonation_text: z.string().min(1),
  contour_pattern: z.string().min(1).default("rise_fall"),
  struggle_ids: z.array(z.string().uuid()).default([])
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuthForRoute();
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const supabase = await createSupabaseServerClient();

    const { data: setRow, error: setError } = await supabase
      .from("practice_sets")
      .select("id")
      .eq("id", parsed.data.set_id)
      .eq("user_id", auth.userId)
      .single();

    if (setError || !setRow) {
      return fail("Practice set not found", 404);
    }

    const { data: card, error: cardError } = await supabase
      .from("practice_cards")
      .insert({
        set_id: parsed.data.set_id,
        order_index: parsed.data.order_index,
        sentence: parsed.data.sentence,
        ipa: parsed.data.ipa,
        stress_map: parsed.data.stress_map,
        intonation_text: parsed.data.intonation_text,
        contour_pattern: parsed.data.contour_pattern
      })
      .select("*")
      .single();

    if (cardError) {
      throw cardError;
    }

    if (parsed.data.struggle_ids.length > 0) {
      const rows = parsed.data.struggle_ids.map((struggleId) => ({
        card_id: card.id,
        struggle_id: struggleId
      }));

      const { error: tagError } = await supabase.from("practice_card_tags").insert(rows);
      if (tagError) {
        throw tagError;
      }
    }

    return ok(card, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
