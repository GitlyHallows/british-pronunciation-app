import { getAdminClient, getTargetUserId, requireEnv } from "./_common";
import { toModernRpSentenceIpa } from "../lib/modern-rp-ipa";

type CardRow = {
  id: string;
  sentence: string;
  ipa: string;
  set_id: string;
};

async function withRetry<T = any>(label: string, run: () => PromiseLike<T>, attempts = 6): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const transient = /(fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|network|socket hang up)/i.test(message);
      if (!transient || attempt === attempts) break;
      const delay = 300 * attempt;
      console.warn(`[retry] ${label} attempt ${attempt}/${attempts} failed: ${message}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

async function main() {
  const targetEmail = requireEnv("SEED_USER_EMAIL");
  const supabase = getAdminClient();
  const userId = await withRetry("lookup target user", () => getTargetUserId(targetEmail));

  const { data: sets, error: setsError } = await withRetry<any>("load codex-variety sets", () =>
    supabase.from("practice_sets").select("id").eq("user_id", userId).eq("source", "codex-variety")
  );

  if (setsError) throw setsError;
  const setIds = ((sets ?? []) as Array<{ id: string }>).map((set) => set.id);
  if (setIds.length === 0) {
    console.log("No codex-variety sets found.");
    return;
  }

  const cards: CardRow[] = [];
  for (const setId of setIds) {
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await withRetry<any>(`load cards for set ${setId} range ${from}`, () =>
        supabase
          .from("practice_cards")
          .select("id, sentence, ipa, set_id")
          .eq("set_id", setId)
          .order("order_index", { ascending: true })
          .range(from, from + pageSize - 1)
      );

      if (error) throw error;
      const chunk = (data ?? []) as CardRow[];
      if (chunk.length === 0) break;

      cards.push(...chunk);
      if (chunk.length < pageSize) break;
      from += pageSize;
    }
  }

  const updates: Array<{ id: string; ipa: string }> = [];
  const failures: Array<{ cardId: string; sentence: string; reason: string }> = [];

  for (const card of cards) {
    try {
      const ipa = toModernRpSentenceIpa(card.sentence);
      updates.push({ id: card.id, ipa });
    } catch (error) {
      failures.push({
        cardId: card.id,
        sentence: card.sentence,
        reason: error instanceof Error ? error.message : "Unknown IPA conversion error"
      });
    }
  }

  if (failures.length > 0) {
    console.error(JSON.stringify({ failures }, null, 2));
    throw new Error(`IPA conversion failed for ${failures.length} cards.`);
  }

  let updated = 0;
  for (const row of updates) {
    const { error } = await withRetry<any>(`update card ${row.id}`, () =>
      supabase.from("practice_cards").update({ ipa: row.ipa }).eq("id", row.id)
    );
    if (error) throw error;
    updated += 1;
  }

  console.log(
    JSON.stringify(
      {
        sets: setIds.length,
        cardsScanned: cards.length,
        cardsUpdated: updated
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
