import Link from "next/link";
import { requireAuthForPage } from "@/lib/auth";
import { getRecordingsForUser } from "@/lib/data";
import { formatLocalDateTime } from "@/lib/time";
import { RecordingUploadForm } from "@/components/recording-upload-form";

export default async function RecordingsPage() {
  const auth = await requireAuthForPage();
  const recordings = await getRecordingsForUser(auth.userId);

  return (
    <section className="space-y-6">
      <RecordingUploadForm />

      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900">Saved recordings</h3>

        {recordings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
            No recordings yet.
          </p>
        ) : (
          <div className="grid gap-3">
            {recordings.map((recording) => (
              <Link
                key={recording.id}
                href={`/practice/recordings/${recording.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-teal/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{recording.file_name}</p>
                  <span className="text-xs uppercase tracking-[0.12em] text-slate-500">{recording.date_bucket_london}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{recording.description || "No description"}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Local: {formatLocalDateTime(recording.recorded_at)}</span>
                  {recording.speaking_with ? <span>With: {recording.speaking_with}</span> : null}
                  <span>{Math.round(recording.bytes / 1024)} KB</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
