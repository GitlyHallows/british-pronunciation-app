export default function LearningPage() {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-teal/20 bg-mint/50 p-6">
        <h3 className="font-[var(--font-dm-serif)] text-3xl text-ink">Learning Section</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          This section is intentionally scaffolded for upcoming educational content such as IPA symbols,
          phonetic rules, intonation theory, and reference drills.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          "IPA Symbol Atlas",
          "Intonation Patterns",
          "Vowel and Consonant Maps",
          "Personal Notes and Benchmarks"
        ].map((item) => (
          <article key={item} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h4 className="font-semibold text-slate-900">{item}</h4>
            <p className="mt-2 text-sm text-slate-600">Placeholder module ready for future content.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
