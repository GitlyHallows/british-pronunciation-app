import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { load as loadHtml } from "cheerio";
import {
  getAdminClient,
  getRepoRoot,
  getTargetUserId,
  parseDateTimeFromPdfTimestamp,
  requireEnv
} from "./_common";

const DEFAULT_PDF_PATH = "/Users/lalit/Downloads/Linking R & WV Practice Cards.pdf";
const DEFAULT_HTML_PATH = "sentence_showcase/linking_r_vw_drills.html";
const SET_TITLE = "Linking R & WV Practice Cards";

async function main() {
  const pdfPath = process.argv[2] ?? DEFAULT_PDF_PATH;
  const htmlPath = process.argv[3] ?? path.resolve(getRepoRoot(), DEFAULT_HTML_PATH);
  const userEmail = requireEnv("ALLOWED_EMAILS").split(",")[0]?.trim();

  if (!userEmail) {
    throw new Error("ALLOWED_EMAILS is missing a primary user email.");
  }

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF not found at ${pdfPath}`);
  }
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`HTML deck not found at ${htmlPath}`);
  }

  const timestamp = extractPdfTimestamp(pdfPath);
  const timestampInfo = parseDateTimeFromPdfTimestamp(timestamp);
  const cards = parseCardsFromHtml(htmlPath);

  if (cards.length === 0) {
    throw new Error("No cards found in HTML source.");
  }

  const userId = await getTargetUserId(userEmail);
  const supabase = getAdminClient();

  const { data: existingSets, error: existingSetError } = await supabase
    .from("practice_sets")
    .select("id")
    .eq("user_id", userId)
    .eq("section_type", "misc")
    .eq("title", SET_TITLE)
    .eq("date_bucket_london", timestampInfo.londonDateBucket)
    .order("created_at", { ascending: true })
    .limit(1);

  if (existingSetError) {
    throw existingSetError;
  }

  let setId = existingSets?.[0]?.id as string | undefined;

  if (!setId) {
    const { data: latestSetForDate, error: latestSetError } = await supabase
      .from("practice_sets")
      .select("set_index")
      .eq("user_id", userId)
      .eq("section_type", "misc")
      .eq("date_bucket_london", timestampInfo.londonDateBucket)
      .is("struggle_id", null)
      .order("set_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestSetError) throw latestSetError;
    const setIndex = (latestSetForDate?.set_index ?? 0) + 1;

    const { data: insertedSet, error: setInsertError } = await supabase
      .from("practice_sets")
      .insert({
        user_id: userId,
        section_type: "misc",
        struggle_id: null,
        date_bucket_london: timestampInfo.londonDateBucket,
        set_index: setIndex,
        title: SET_TITLE,
        source: "pdf-import"
      })
      .select("id")
      .single();

    if (setInsertError) {
      throw setInsertError;
    }

    setId = insertedSet.id;
  } else {
    const { error: cleanupError } = await supabase.from("practice_cards").delete().eq("set_id", setId);
    if (cleanupError) throw cleanupError;
  }

  const cardRows = cards.map((card, index) => ({
    set_id: setId,
    order_index: index,
    sentence: card.sentence,
    ipa: card.ipa,
    stress_map: card.stress,
    intonation_text: card.intonation,
    contour_pattern: card.pattern
  }));

  const { error: insertCardsError } = await supabase.from("practice_cards").insert(cardRows);
  if (insertCardsError) {
    throw insertCardsError;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        sourcePdf: pdfPath,
        sourceHtml: htmlPath,
        parsedPdfTimestamp: timestamp,
        londonDateBucket: timestampInfo.londonDateBucket,
        setId,
        cardsImported: cards.length
      },
      null,
      2
    )
  );
}

function extractPdfTimestamp(pdfPath: string): string {
  const tmpPath = path.join(os.tmpdir(), `linking-cards-${Date.now()}.txt`);

  execFileSync("gs", [
    "-q",
    "-dNOPAUSE",
    "-dBATCH",
    "-sDEVICE=txtwrite",
    "-dFirstPage=1",
    "-dLastPage=1",
    `-sOutputFile=${tmpPath}`,
    pdfPath
  ]);

  const text = fs.readFileSync(tmpPath, "utf8");
  fs.unlinkSync(tmpPath);

  const match = text.match(/(\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2})/);
  if (!match) {
    throw new Error("Could not read timestamp from PDF first page.");
  }

  return match[1];
}

type ParsedCard = {
  sentence: string;
  ipa: string;
  stress: string;
  intonation: string;
  pattern: string;
};

function parseCardsFromHtml(htmlPath: string): ParsedCard[] {
  const html = fs.readFileSync(htmlPath, "utf8");
  const $ = loadHtml(html);
  const cards: ParsedCard[] = [];

  $("article.card").each((_, element) => {
    const sentence = $(element).find("p.sentence").text().replace(/\s+/g, " ").trim();
    const ipa = $(element).find("p.ipa").text().replace(/\s+/g, " ").trim();
    const stress = $(element)
      .find("p.stress")
      .text()
      .replace(/Stress\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
    const intonation = $(element)
      .find("p.intonation-text")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const className = $(element).find("svg.curve").attr("class") ?? "";
    const pattern = className.includes("steady") ? "steady" : "rise_fall";

    if (sentence && ipa && stress && intonation) {
      cards.push({ sentence, ipa, stress, intonation, pattern });
    }
  });

  return cards;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
