import { z } from "zod";
import { requireAuthForRoute } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, handleRouteError, ok } from "@/lib/http";

const cardSchema = z.object({
  order_index: z.number().int().nonnegative(),
  sentence: z.string().min(1),
  ipa: z.string().min(1),
  stress_map: z.string().min(1),
  intonation_text: z.string().min(1),
  contour_pattern: z.string().min(1).default("rise_fall"),
  struggle_ids: z.array(z.string().uuid()).optional()
});

const bulkSchema = z.object({
  replaceExisting: z.boolean().default(false),
  cards: z.array(cardSchema).min(1)
});

export async function POST(request: Request, { params }: { params: Promise<{ setId: string }> }) {
  try {
    const { setId } = await params;
    const auth = await requireAuthForRoute();
    const body = await request.json();
    const parsed = bulkSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const supabase = await createSupabaseServerClient();

    const { data: setRow, error: setError } = await supabase
      .from("practice_sets")
      .select("id")
      .eq("id", setId)
      .eq("user_id", auth.userId)
      .single();

    if (setError || !setRow) {
      return fail("Practice set not found", 404);
    }

    if (parsed.data.replaceExisting) {
      const { error: removeError } = await supabase.from("practice_cards").delete().eq("set_id", setId);
      if (removeError) throw removeError;
    }

    const cardsPayload = parsed.data.cards.map((card) => ({
      set_id: setId,
      order_index: card.order_index,
      sentence: card.sentence,
      ipa: card.ipa,
      stress_map: card.stress_map,
      intonation_text: card.intonation_text,
      contour_pattern: card.contour_pattern
    }));

    const { data: insertedCards, error: cardsError } = await supabase
      .from("practice_cards")
      .insert(cardsPayload)
      .select("id, order_index");

    if (cardsError) {
      throw cardsError;
    }

    const cardIdByOrder = new Map((insertedCards ?? []).map((row) => [row.order_index, row.id]));
    const tagRows: Array<{ card_id: string; struggle_id: string }> = [];

    for (const card of parsed.data.cards) {
      const cardId = cardIdByOrder.get(card.order_index);
      if (!cardId || !card.struggle_ids?.length) continue;
      for (const struggleId of card.struggle_ids) {
        tagRows.push({ card_id: cardId, struggle_id: struggleId });
      }
    }

    if (tagRows.length > 0) {
      const { error: tagError } = await supabase.from("practice_card_tags").insert(tagRows);
      if (tagError) throw tagError;
    }

    return ok({ inserted: insertedCards?.length ?? 0, tagsInserted: tagRows.length }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
