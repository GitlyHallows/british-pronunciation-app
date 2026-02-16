import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthForPage } from "@/lib/auth";
import { getSetDetails } from "@/lib/data";
import { SentenceCard } from "@/components/sentence-card";
import { formatLocalDate } from "@/lib/time";

export default async function PracticeSetPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const auth = await requireAuthForPage();

  let data;
  try {
    data = await getSetDetails(auth.userId, setId);
  } catch {
    notFound();
  }

  const tagMap = new Map<string, string[]>();
  for (const tag of data.tags) {
    const existing = tagMap.get(tag.card_id) ?? [];
    if (tag.struggles?.title) {
      existing.push(tag.struggles.title);
    }
    tagMap.set(tag.card_id, existing);
  }

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
              {data.set.section_type.toUpperCase()} · Set {data.set.set_index}
            </p>
            <h3 className="mt-1 font-[var(--font-dm-serif)] text-3xl text-ink">{data.set.title}</h3>
            <p className="mt-2 text-sm text-slate-600">
              London bucket {data.set.date_bucket_london} · Local display {formatLocalDate(data.set.date_bucket_london)}
            </p>
          </div>
          <Link
            href={`/practice/sets/${data.set.id}/print`}
            className="inline-flex rounded-full border border-teal bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f8f83]"
          >
            Print / Export
          </Link>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        {data.cards.map((card) => (
          <div key={card.id} className="space-y-2">
            <SentenceCard card={card} indexLabel={String(card.order_index).padStart(2, "0")} />
            {(tagMap.get(card.id) ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-2 px-1">
                {(tagMap.get(card.id) ?? []).map((title) => (
                  <span
                    key={`${card.id}-${title}`}
                    className="rounded-full border border-teal/30 bg-teal-soft px-2.5 py-1 text-xs font-medium text-teal"
                  >
                    {title}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
