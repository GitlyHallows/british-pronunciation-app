import fs from "node:fs";
import path from "node:path";
import { load as loadHtml } from "cheerio";
import { getAdminClient, getRepoRoot, getTargetUserId, requireEnv } from "./_common";

const PDF_SET_TITLE = "Linking R & WV Practice Cards";
const STRUGGLE_DATE = "2026-02-16";
const CARDS_PER_STRUGGLE = 20;

async function main() {
  const userEmail = requireEnv("ALLOWED_EMAILS").split(",")[0]?.trim();
  if (!userEmail) throw new Error("ALLOWED_EMAILS missing");

  const userId = await getTargetUserId(userEmail);
  const supabase = getAdminClient();

  const htmlPath = path.resolve(getRepoRoot(), "sentence_showcase/linking_r_vw_drills.html");
  const expectedPdfCards = countCardsInHtml(htmlPath);

  const { data: miscSets, error: miscSetError } = await supabase
    .from("practice_sets")
    .select("id")
    .eq("user_id", userId)
    .eq("section_type", "misc")
    .eq("title", PDF_SET_TITLE)
    .order("created_at", { ascending: true });

  if (miscSetError) throw miscSetError;
  if (!miscSets || miscSets.length === 0) {
    throw new Error("No miscellaneous PDF set found.");
  }

  const miscSetId = miscSets[0].id;
  const { count: miscCardCount, error: miscCardError } = await supabase
    .from("practice_cards")
    .select("id", { count: "exact", head: true })
    .eq("set_id", miscSetId);

  if (miscCardError) throw miscCardError;

  const { data: struggles, error: strugglesError } = await supabase
    .from("struggles")
    .select("id, title")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (strugglesError) throw strugglesError;

  const struggleChecks = [] as Array<{ title: string; ok: boolean; setId: string | null; cardCount: number }>;

  for (const struggle of struggles ?? []) {
    const { data: set, error: setError } = await supabase
      .from("practice_sets")
      .select("id")
      .eq("user_id", userId)
      .eq("section_type", "struggle")
      .eq("struggle_id", struggle.id)
      .eq("date_bucket_london", STRUGGLE_DATE)
      .eq("set_index", 1)
      .maybeSingle();

    if (setError) throw setError;

    if (!set) {
      struggleChecks.push({ title: struggle.title, ok: false, setId: null, cardCount: 0 });
      continue;
    }

    const { count: cardCount, error: cardCountError } = await supabase
      .from("practice_cards")
      .select("id", { count: "exact", head: true })
      .eq("set_id", set.id);

    if (cardCountError) throw cardCountError;

    struggleChecks.push({
      title: struggle.title,
      ok: (cardCount ?? 0) === CARDS_PER_STRUGGLE,
      setId: set.id,
      cardCount: cardCount ?? 0
    });
  }

  const failed = struggleChecks.filter((item) => !item.ok);

  const summary = {
    misc: {
      expectedCardsFromPdfDeck: expectedPdfCards,
      importedCards: miscCardCount ?? 0,
      ok: (miscCardCount ?? 0) === expectedPdfCards
    },
    struggles: {
      total: struggleChecks.length,
      expectedCardsPerSet: CARDS_PER_STRUGGLE,
      allOk: failed.length === 0,
      failed
    }
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!summary.misc.ok || !summary.struggles.allOk) {
    process.exit(1);
  }
}

function countCardsInHtml(htmlPath: string): number {
  const html = fs.readFileSync(htmlPath, "utf8");
  const $ = loadHtml(html);
  return $("article.card").length;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
