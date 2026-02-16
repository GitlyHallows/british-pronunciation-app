"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import type { RecordingAnnotation } from "@/lib/types";

type RecordingPlayerProps = {
  recordingId: string;
  initialAnnotations: RecordingAnnotation[];
};

type RangeDraft = {
  start: number;
  end: number;
};

export function RecordingPlayer({ recordingId, initialAnnotations }: RecordingPlayerProps) {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<any>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [draft, setDraft] = useState<RangeDraft | null>(null);
  const [annotations, setAnnotations] = useState(initialAnnotations);
  const [comment, setComment] = useState("");
  const [color, setColor] = useState<"red" | "green">("red");
  const [error, setError] = useState<string | null>(null);

  const sortedAnnotations = useMemo(
    () => [...annotations].sort((a, b) => Number(a.start_sec) - Number(b.start_sec)),
    [annotations]
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!waveformRef.current) return;

      const response = await fetch(`/api/v1/recordings/${recordingId}/presign-download`);
      if (!response.ok) {
        setError("Unable to load recording stream URL.");
        return;
      }

      const { downloadUrl } = (await response.json()) as { downloadUrl: string };
      if (cancelled) return;

      const regions = RegionsPlugin.create() as any;

      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#9cc8ff",
        progressColor: "#16a394",
        cursorColor: "#1f2a37",
        height: 120,
        url: downloadUrl,
        plugins: [regions as any]
      });

      wavesurferRef.current = ws;
      regionsRef.current = regions;

      ws.on("ready", () => {
        setReady(true);
        renderPersistedRegions();
        regions.enableDragSelection({ color: "rgba(249,115,22,.15)" });
      });

      ws.on("play", () => setPlaying(true));
      ws.on("pause", () => setPlaying(false));

      regions.on("region-created", (region: any) => {
        if (region.id.startsWith("persisted-")) {
          return;
        }

        for (const currentRegion of regions.getRegions()) {
          if (currentRegion.id !== region.id && !currentRegion.id.startsWith("persisted-")) {
            currentRegion.remove();
          }
        }
        setDraft({ start: region.start, end: region.end });
      });
    }

    bootstrap().catch((eventError) => {
      setError(eventError instanceof Error ? eventError.message : "Player failed to initialize");
    });

    return () => {
      cancelled = true;
      wavesurferRef.current?.destroy();
      wavesurferRef.current = null;
      regionsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingId]);

  useEffect(() => {
    renderPersistedRegions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations]);

  function renderPersistedRegions() {
    const regions = regionsRef.current;
    if (!regions) return;

    for (const region of regions.getRegions()) {
      if (region.id.startsWith("persisted-")) {
        region.remove();
      }
    }

    for (const annotation of annotations) {
      regions.addRegion({
        id: `persisted-${annotation.id}`,
        start: Number(annotation.start_sec),
        end: Number(annotation.end_sec),
        color: annotation.color === "green" ? "rgba(16,185,129,.24)" : "rgba(239,68,68,.24)",
        drag: false,
        resize: false
      });
    }
  }

  async function saveAnnotation() {
    if (!draft) {
      setError("Select a time range first.");
      return;
    }

    const response = await fetch(`/api/v1/recordings/${recordingId}/annotations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        startSec: draft.start,
        endSec: draft.end,
        color,
        comment
      })
    });

    if (!response.ok) {
      setError("Unable to save annotation.");
      return;
    }

    const saved = (await response.json()) as RecordingAnnotation;
    setAnnotations((prev) => [...prev, saved]);
    setComment("");
    setDraft(null);

    const regions = regionsRef.current;
    if (regions) {
      for (const region of regions.getRegions()) {
        if (!region.id.startsWith("persisted-")) {
          region.remove();
        }
      }
    }
  }

  async function deleteAnnotation(annotationId: string) {
    const response = await fetch(`/api/v1/recordings/${recordingId}/annotations?annotationId=${annotationId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setError("Unable to delete annotation.");
      return;
    }

    setAnnotations((prev) => prev.filter((item) => item.id !== annotationId));
  }

  function jumpTo(annotation: RecordingAnnotation) {
    const ws = wavesurferRef.current;
    if (!ws || !ready) return;
    ws.setTime(Number(annotation.start_sec));
    ws.play();
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div ref={waveformRef} className="rounded-xl bg-slate-50 p-2" />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => wavesurferRef.current?.playPause()}
            disabled={!ready}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <span className="text-xs text-slate-500">Drag over waveform to select a timestamp range.</span>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            Draft range:{" "}
            {draft ? `${formatSeconds(draft.start)} - ${formatSeconds(draft.end)}` : "Select on waveform"}
          </p>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="e.g. R is tapped here, missed POT vowel"
            className="min-h-[92px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col items-stretch gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setColor("red")}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                color === "red" ? "border-red-600 bg-red-600 text-white" : "border-red-300 text-red-700"
              }`}
            >
              Red
            </button>
            <button
              type="button"
              onClick={() => setColor("green")}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                color === "green" ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-300 text-emerald-700"
              }`}
            >
              Green
            </button>
          </div>

          <button
            type="button"
            onClick={saveAnnotation}
            className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f8f83]"
          >
            Save Comment
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-2">
        {sortedAnnotations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
            No comments yet.
          </p>
        ) : (
          sortedAnnotations.map((annotation) => (
            <div
              key={annotation.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
            >
              <button
                type="button"
                onClick={() => jumpTo(annotation)}
                className="text-left"
                title="Jump to this range"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {formatSeconds(Number(annotation.start_sec))} - {formatSeconds(Number(annotation.end_sec))}
                </p>
                <p className="text-sm text-slate-600">{annotation.comment}</p>
              </button>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
                    annotation.color === "green"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {annotation.color}
                </span>
                <button
                  type="button"
                  onClick={() => deleteAnnotation(annotation.id)}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function formatSeconds(value: number): string {
  const total = Math.max(0, Math.floor(value));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
