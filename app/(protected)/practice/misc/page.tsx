import Link from "next/link";
import { requireAuthForPage } from "@/lib/auth";
import { getMiscPracticeSets } from "@/lib/data";
import { formatLocalDate } from "@/lib/time";

export default async function MiscPage() {
  const auth = await requireAuthForPage();
  const sets = await getMiscPracticeSets(auth.userId);
  const grouped = groupByDate(sets);

  return (
    <section className="space-y-5">
      <p className="text-sm text-slate-600">
        Miscellaneous holds combination drills across multiple struggles. Initial seed comes from the PDF card deck.
      </p>

      {grouped.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
          No miscellaneous sets found yet.
        </p>
      ) : (
        grouped.map(({ date, setsForDate }) => (
          <section key={date} className="rounded-2xl border border-slate-200 bg-white p-5">
            <header className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{formatLocalDate(date)}</h3>
              <span className="text-xs uppercase tracking-[0.12em] text-slate-500">London bucket: {date}</span>
            </header>
            <div className="grid gap-3 md:grid-cols-2">
              {setsForDate.map((set) => (
                <Link
                  key={set.id}
                  href={`/practice/sets/${set.id}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-teal/40 hover:bg-teal-soft"
                >
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Set {set.set_index}</p>
                  <p className="mt-1 font-semibold text-slate-900">{set.title}</p>
                  <p className="mt-1 text-xs text-slate-500">Source: {set.source}</p>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </section>
  );
}

function groupByDate<T extends { date_bucket_london: string; set_index: number }>(sets: T[]) {
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
    setsForDate: setsForDate.sort((a, b) => a.set_index - b.set_index)
  }));
}
