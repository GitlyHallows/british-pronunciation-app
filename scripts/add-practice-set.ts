import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getAdminClient, getTargetUserId, requireEnv } from "./_common";
import { toLondonDateBucket } from "../lib/time";

const inputSchema = z.object({
  section_type: z.enum(["struggle", "misc"]),
  struggle_title: z.string().optional(),
  date: z.string().optional(),
  title: z.string(),
  set_index: z.number().int().positive().optional(),
  source: z.string().default("codex"),
  cards: z
    .array(
      z.object({
        sentence: z.string(),
        ipa: z.string(),
        stress_map: z.string(),
        intonation_text: z.string(),
        contour_pattern: z.string().default("rise_fall"),
        struggle_titles: z.array(z.string()).optional()
      })
    )
    .min(1)
});

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error("Usage: tsx scripts/add-practice-set.ts <payload.json>");
  }

  const resolved = path.resolve(process.cwd(), filePath);
  const parsed = inputSchema.parse(JSON.parse(fs.readFileSync(resolved, "utf8")));

  const userEmail = requireEnv("ALLOWED_EMAILS").split(",")[0]?.trim();
  if (!userEmail) throw new Error("ALLOWED_EMAILS missing");

  const userId = await getTargetUserId(userEmail);
  const supabase = getAdminClient();

  let struggleId: string | null = null;
  if (parsed.section_type === "struggle") {
    if (!parsed.struggle_title) {
      throw new Error("struggle_title is required when section_type is 'struggle'");
    }

    const { data: struggle, error: struggleError } = await supabase
      .from("struggles")
      .select("id")
      .eq("user_id", userId)
      .eq("title", parsed.struggle_title)
      .maybeSingle();

    if (struggleError) throw struggleError;
    if (!struggle) {
      throw new Error(`Struggle not found: ${parsed.struggle_title}`);
    }

    struggleId = struggle.id;
  }

  const dateBucket = toLondonDateBucket(parsed.date ?? new Date().toISOString());

  let setIndex = parsed.set_index ?? 0;
  if (!setIndex) {
    let query = supabase
      .from("practice_sets")
      .select("set_index")
      .eq("user_id", userId)
      .eq("section_type", parsed.section_type)
      .eq("date_bucket_london", dateBucket)
      .order("set_index", { ascending: false })
      .limit(1);

    query = struggleId ? query.eq("struggle_id", struggleId) : query.is("struggle_id", null);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    setIndex = (data?.set_index ?? 0) + 1;
  }

  const { data: createdSet, error: createSetError } = await supabase
    .from("practice_sets")
    .insert({
      user_id: userId,
      section_type: parsed.section_type,
      struggle_id: struggleId,
      date_bucket_london: dateBucket,
      set_index: setIndex,
      title: parsed.title,
      source: parsed.source
    })
    .select("id")
    .single();

  if (createSetError) throw createSetError;

  const cards = parsed.cards.map((card, index) => ({
    set_id: createdSet.id,
    order_index: index,
    sentence: card.sentence,
    ipa: card.ipa,
    stress_map: card.stress_map,
    intonation_text: card.intonation_text,
    contour_pattern: card.contour_pattern
  }));

  const { data: insertedCards, error: cardError } = await supabase
    .from("practice_cards")
    .insert(cards)
    .select("id, order_index");

  if (cardError) throw cardError;

  const insertedByOrder = new Map((insertedCards ?? []).map((row) => [row.order_index, row.id]));
  const tagRows: Array<{ card_id: string; struggle_id: string }> = [];

  for (const [index, card] of parsed.cards.entries()) {
    const cardId = insertedByOrder.get(index);
    if (!cardId || !card.struggle_titles?.length) continue;

    const { data: tags, error: tagQueryError } = await supabase
      .from("struggles")
      .select("id")
      .eq("user_id", userId)
      .in("title", card.struggle_titles);

    if (tagQueryError) throw tagQueryError;
    for (const tag of tags ?? []) {
      tagRows.push({ card_id: cardId, struggle_id: tag.id });
    }
  }

  if (tagRows.length > 0) {
    const { error: tagError } = await supabase.from("practice_card_tags").insert(tagRows);
    if (tagError) throw tagError;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        setId: createdSet.id,
        cards: insertedCards?.length ?? 0,
        tags: tagRows.length,
        londonDateBucket: dateBucket,
        setIndex
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
