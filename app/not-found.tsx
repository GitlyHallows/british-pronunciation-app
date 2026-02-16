import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="font-[var(--font-dm-serif)] text-4xl text-slate-900">Not Found</h1>
        <p className="mt-3 text-sm text-slate-600">The item you requested does not exist or is outside your access scope.</p>
        <Link href="/practice/struggles" className="mt-5 inline-flex rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white">
          Back to Practice
        </Link>
      </section>
    </main>
  );
}
