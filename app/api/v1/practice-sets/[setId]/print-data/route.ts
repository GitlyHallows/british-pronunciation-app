import { requireAuthForRoute } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, handleRouteError, ok } from "@/lib/http";

export async function GET(_: Request, { params }: { params: Promise<{ setId: string }> }) {
  try {
    const { setId } = await params;
    const auth = await requireAuthForRoute();
    const supabase = await createSupabaseServerClient();

    const { data: setRow, error: setError } = await supabase
      .from("practice_sets")
      .select("*")
      .eq("id", setId)
      .eq("user_id", auth.userId)
      .single();

    if (setError || !setRow) {
      return fail("Practice set not found", 404);
    }

    const { data: cards, error: cardsError } = await supabase
      .from("practice_cards")
      .select("*")
      .eq("set_id", setId)
      .order("order_index", { ascending: true });

    if (cardsError) {
      throw cardsError;
    }

    return ok({ set: setRow, cards: cards ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
