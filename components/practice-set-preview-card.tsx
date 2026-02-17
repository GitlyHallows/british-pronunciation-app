"use client";

import Link from "next/link";
import { useState } from "react";
import type { PracticeSet, PracticeSetPreviewResponse } from "@/lib/types";

type PracticeSetPreviewCardProps = {
  set: Pick<PracticeSet, "id" | "set_index" | "title" | "source">;
  previewLimit?: number;
};

export function PracticeSetPreviewCard({ set, previewLimit = 3 }: PracticeSetPreviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [previewData, setPreviewData] = useState<PracticeSetPreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const togglePreview = async () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    if (nextExpanded && !previewData && !loadingPreview) {
      await fetchPreview();
    }
  };

  const fetchPreview = async () => {
    setLoadingPreview(true);
    setPreviewError(null);

    try {
      const response = await fetch(`/api/v1/practice-sets/${set.id}/preview?limit=${previewLimit}`, {
        cache: "no-store"
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to load preview"));
      }

      const payload = (await response.json()) as PracticeSetPreviewResponse;
      setPreviewData(payload);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const hiddenCount = previewData ? Math.max(previewData.total_cards - previewData.cards.length, 0) : 0;

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Set {set.set_index}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{set.title}</p>
          <p className="mt-1 text-xs text-slate-500">Source: {set.source}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={togglePreview}
            aria-expanded={expanded}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal/40 hover:text-teal"
          >
            {expanded ? "Hide preview" : "Preview"}
          </button>
          <Link
            href={`/practice/sets/${set.id}`}
            className="rounded-full border border-teal bg-teal px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0f8f83]"
          >
            Open set
          </Link>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          {loadingPreview ? <p className="text-sm text-slate-600">Loading preview...</p> : null}

          {!loadingPreview && previewError ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-red-600">{previewError}</p>
              <button
                type="button"
                onClick={fetchPreview}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal/40 hover:text-teal"
              >
                Retry
              </button>
            </div>
          ) : null}

          {!loadingPreview && !previewError && previewData ? (
            previewData.cards.length === 0 ? (
              <p className="text-sm text-slate-600">No cards in this set yet.</p>
            ) : (
              <div>
                <ul className="space-y-2">
                  {previewData.cards.map((card) => (
                    <li key={card.id} className="flex min-w-0 items-start gap-3 text-sm text-slate-700">
                      <span className="pt-0.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-teal">
                        {String(card.order_index).padStart(2, "0")}
                      </span>
                      <p className="min-w-0 flex-1 break-words leading-6">{card.sentence}</p>
                    </li>
                  ))}
                </ul>
                {hiddenCount > 0 ? (
                  <p className="mt-2 text-xs font-medium text-slate-500">+{hiddenCount} more in this set</p>
                ) : null}
              </div>
            )
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload?.error) {
      return `${fallback}: ${payload.error}`;
    }
  } catch {
    // Ignore invalid JSON and return fallback.
  }

  return `${fallback} (${response.status})`;
}
