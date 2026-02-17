import { notFound } from "next/navigation";
import { requireAuthForPage } from "@/lib/auth";
import { PracticeSetPreviewCard } from "@/components/practice-set-preview-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPracticeSetsForStruggle } from "@/lib/data";
import { formatLocalDate } from "@/lib/time";

export default async function StruggleDetailPage({ params }: { params: Promise<{ struggleId: string }> }) {
  const { struggleId } = await params;
  const auth = await requireAuthForPage();
  const supabase = await createSupabaseServerClient();

  const { data: struggle, error: struggleError } = await supabase
    .from("struggles")
    .select("*")
    .eq("id", struggleId)
    .eq("user_id", auth.userId)
    .single();

  if (struggleError || !struggle) {
    notFound();
  }

  const sets = await getPracticeSetsForStruggle(auth.userId, struggleId);
  const grouped = groupByDate(sets);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Struggle Detail</p>
        <h3 className="mt-2 font-[var(--font-dm-serif)] text-3xl text-ink">{struggle.title}</h3>
        {struggle.description ? <p className="mt-3 text-sm leading-6 text-slate-700">{struggle.description}</p> : null}
      </div>

      {grouped.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
          No sets yet. Ask Codex to add a new set for this struggle.
        </p>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ date, setsForDate }) => (
            <section key={date} className="rounded-2xl border border-slate-200 bg-white p-5">
              <header className="mb-4 flex items-center justify-between">
                <h4 className="font-semibold text-slate-900">{formatLocalDate(date)}</h4>
                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">London bucket: {date}</span>
              </header>
              <div className="grid gap-3 md:grid-cols-2">
                {setsForDate.map((set) => (
                  <PracticeSetPreviewCard key={set.id} set={set} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function groupByDate<T extends { date_bucket_london: string }>(sets: T[]) {
  const map = new Map<string, T[]>();

  for (const set of sets) {
    const existing = map.get(set.date_bucket_london);
    if (existing) {
      existing.push(set);
    } else {
      map.set(set.date_bucket_london, [set]);
    }
  }

  return [...map.entries()].map(([date, setsForDate]) => ({
    date,
    setsForDate: setsForDate.sort((a: any, b: any) => a.set_index - b.set_index)
  }));
}
