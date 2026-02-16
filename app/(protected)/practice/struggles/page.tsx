import Link from "next/link";
import { requireAuthForPage } from "@/lib/auth";
import { getStrugglesWithSetCounts } from "@/lib/data";

export default async function StrugglesPage() {
  const auth = await requireAuthForPage();
  const struggles = await getStrugglesWithSetCounts(auth.userId);

  return (
    <section className="space-y-4">
      <p className="text-sm text-slate-600">
        Every struggle has independent date buckets and set numbering. Click a struggle to open dated sets.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {struggles.map((struggle) => (
          <Link
            key={struggle.id}
            href={`/practice/struggles/${struggle.id}`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-card"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex rounded-full bg-mint px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-teal">
                {struggle.set_count} set{struggle.set_count === 1 ? "" : "s"}
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{struggle.status}</span>
            </div>
            <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{struggle.title}</h3>
            {struggle.description ? (
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{struggle.description}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
