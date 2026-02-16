"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PresignUploadResponse = {
  uploadUrl: string;
  key: string;
};

export function RecordingUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [speakingWith, setSpeakingWith] = useState("");
  const [recordedAt, setRecordedAt] = useState(() => toLocalDateTimeInput(new Date()));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => pending || !file, [pending, file]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!file) return;

    setPending(true);
    setError(null);

    try {
      const presignResponse = await fetch("/api/v1/recordings/presign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "audio/mpeg",
          bytes: file.size
        })
      });

      if (!presignResponse.ok) {
        throw new Error("Unable to create upload URL");
      }

      const presigned = (await presignResponse.json()) as PresignUploadResponse;

      const uploadResponse = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "audio/mpeg"
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload to S3 failed");
      }

      const completeResponse = await fetch("/api/v1/recordings/complete-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: presigned.key,
          fileName: file.name,
          mimeType: file.type || "audio/mpeg",
          bytes: file.size,
          description,
          speakingWith,
          recordedAt
        })
      });

      if (!completeResponse.ok) {
        throw new Error("Unable to finalize recording");
      }

      setFile(null);
      setDescription("");
      setSpeakingWith("");
      setRecordedAt(toLocalDateTimeInput(new Date()));
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Upload failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">Add Recording</h3>

      <label className="grid gap-1 text-sm text-slate-700">
        Recording file
        <input
          type="file"
          accept="audio/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          required
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm text-slate-700">
          Who were you speaking with?
          <input
            value={speakingWith}
            onChange={(event) => setSpeakingWith(event.target.value)}
            placeholder="e.g. Leandro"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-700">
          Recorded at (local time)
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(event) => setRecordedAt(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm text-slate-700">
        Context description
        <textarea
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short context for the conversation"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-xl bg-teal px-4 py-2.5 font-semibold text-white transition hover:bg-[#0f8f83] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Uploading..." : "Upload Recording"}
      </button>
    </form>
  );
}

function toLocalDateTimeInput(value: Date) {
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(
    value.getMinutes()
  )}`;
}
