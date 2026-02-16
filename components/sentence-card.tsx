import { cn } from "@/lib/utils";
import type { PracticeCard } from "@/lib/types";

type SentenceCardProps = {
  card: PracticeCard;
  indexLabel?: string;
  className?: string;
};

export function SentenceCard({ card, indexLabel, className }: SentenceCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_25px_rgba(15,23,42,0.08)]",
        className
      )}
    >
      <header className="mb-2 flex items-start gap-3">
        <span className="pt-0.5 text-lg font-bold text-teal">{indexLabel ?? String(card.order_index).padStart(2, "0")}</span>
        <p className="text-[1.06rem] font-semibold leading-6 text-slate-800">{card.sentence}</p>
      </header>

      <p className="mb-2 font-mono text-[0.94rem] leading-6 text-coral">{card.ipa}</p>

      <div className="space-y-2 text-sm">
        <p className="leading-5 text-slate-800">
          <span className="mr-2 font-semibold text-slate-900">Stress</span>
          {card.stress_map}
        </p>
        <p className="leading-5 text-slate-700">
          <span className="mr-2 font-semibold text-slate-900">Intonation</span>
          {card.intonation_text}
        </p>
        <Contour pattern={card.contour_pattern} />
      </div>
    </article>
  );
}

function Contour({ pattern }: { pattern: string }) {
  const pointsByPattern: Record<string, string> = {
    steady: "2,24 28,20 54,21 80,29",
    rise_fall: "2,26 24,17 52,18 80,30",
    rise: "2,28 26,23 50,18 80,14",
    fall: "2,13 26,18 50,23 80,28"
  };
  const points = pointsByPattern[pattern] ?? pointsByPattern.rise_fall;

  return (
    <svg viewBox="0 0 82 34" className="mt-1 h-8 w-24" role="img" aria-label={`intonation contour ${pattern}`}>
      <polyline
        points={points}
        fill="none"
        stroke="#16a394"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
