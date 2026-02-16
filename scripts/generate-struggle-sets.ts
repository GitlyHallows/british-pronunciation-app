import fs from "node:fs";
import path from "node:path";
import {
  generateCardsForStruggle,
  getAdminClient,
  getRepoRoot,
  getTargetUserId,
  parseStrugglesMarkdown,
  requireEnv
} from "./_common";

const STRUGGLE_DATE = "2026-02-16";
const SET_INDEX = 1;
const CARDS_PER_STRUGGLE = 20;

async function main() {
  const repoRoot = getRepoRoot();
  const strugglesPath = process.argv[2] ?? path.resolve(repoRoot, "struggles.md");

  if (!fs.existsSync(strugglesPath)) {
    throw new Error(`struggles.md not found at ${strugglesPath}`);
  }

  const userEmail = requireEnv("ALLOWED_EMAILS").split(",")[0]?.trim();
  if (!userEmail) throw new Error("ALLOWED_EMAILS must include at least one email");

  const userId = await getTargetUserId(userEmail);
  const supabase = getAdminClient();

  const source = fs.readFileSync(strugglesPath, "utf8");
  const parsedStruggles = parseStrugglesMarkdown(source);

  if (parsedStruggles.length === 0) {
    throw new Error("No struggles parsed from struggles.md");
  }

  let totalCards = 0;
  const report: Array<{ title: string; struggleId: string; setId: string; cards: number }> = [];

  for (const entry of parsedStruggles) {
    const struggleId = await ensureStruggle({ userId, title: entry.title, description: entry.description });
    const setId = await ensureStruggleSet({ userId, struggleId, title: entry.title });

    const cards = generateCardsForStruggle(entry.title, entry.description, CARDS_PER_STRUGGLE);

    const { error: removeCardsError } = await supabase.from("practice_cards").delete().eq("set_id", setId);
    if (removeCardsError) throw removeCardsError;

    const cardRows = cards.map((card) => ({
      set_id: setId,
      order_index: card.order_index,
      sentence: card.sentence,
      ipa: card.ipa,
      stress_map: card.stress_map,
      intonation_text: card.intonation_text,
      contour_pattern: card.contour_pattern
    }));

    const { data: insertedCards, error: insertCardsError } = await supabase
      .from("practice_cards")
      .insert(cardRows)
      .select("id, order_index");

    if (insertCardsError) throw insertCardsError;

    const tags = (insertedCards ?? []).map((card) => ({
      card_id: card.id,
      struggle_id: struggleId
    }));

    if (tags.length > 0) {
      const { error: tagsError } = await supabase.from("practice_card_tags").insert(tags);
      if (tagsError) throw tagsError;
    }

    report.push({
      title: entry.title,
      struggleId,
      setId,
      cards: cards.length
    });
    totalCards += cards.length;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dateBucketLondon: STRUGGLE_DATE,
        strugglesSeeded: report.length,
        cardsPerStruggle: CARDS_PER_STRUGGLE,
        totalCards,
        report
      },
      null,
      2
    )
  );
}

async function ensureStruggle(params: { userId: string; title: string; description: string }) {
  const supabase = getAdminClient();

  const { data: existing, error: findError } = await supabase
    .from("struggles")
    .select("id")
    .eq("user_id", params.userId)
    .eq("title", params.title)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from("struggles")
    .insert({
      user_id: params.userId,
      title: params.title,
      description: params.description,
      status: "active"
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

async function ensureStruggleSet(params: { userId: string; struggleId: string; title: string }) {
  const supabase = getAdminClient();

  const { data: existing, error: findError } = await supabase
    .from("practice_sets")
    .select("id")
    .eq("user_id", params.userId)
    .eq("section_type", "struggle")
    .eq("struggle_id", params.struggleId)
    .eq("date_bucket_london", STRUGGLE_DATE)
    .eq("set_index", SET_INDEX)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from("practice_sets")
    .insert({
      user_id: params.userId,
      section_type: "struggle",
      struggle_id: params.struggleId,
      date_bucket_london: STRUGGLE_DATE,
      set_index: SET_INDEX,
      title: `${params.title} · Initial Set`,
      source: "seed-generated"
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
