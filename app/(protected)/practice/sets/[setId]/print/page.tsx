import { notFound } from "next/navigation";
import { requireAuthForPage } from "@/lib/auth";
import { getSetDetails } from "@/lib/data";
import { SentenceCard } from "@/components/sentence-card";

export default async function PracticeSetPrintPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const auth = await requireAuthForPage();

  let data;
  try {
    data = await getSetDetails(auth.userId, setId);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-[1200px] bg-white px-4 py-6">
      <header className="mb-6 print-hide">
        <h1 className="font-[var(--font-dm-serif)] text-4xl text-slate-900">{data.set.title}</h1>
        <p className="text-sm text-slate-600">Set {data.set.set_index} · London date {data.set.date_bucket_london}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
        {data.cards.map((card) => (
          <SentenceCard key={card.id} card={card} indexLabel={String(card.order_index).padStart(2, "0")} />
        ))}
      </section>
    </main>
  );
}
