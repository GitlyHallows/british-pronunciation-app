import { notFound } from "next/navigation";
import { requireAuthForPage } from "@/lib/auth";
import { getRecordingDetails } from "@/lib/data";
import { formatLocalDateTime } from "@/lib/time";
import { RecordingPlayer } from "@/components/recording-player";

export default async function RecordingDetailPage({ params }: { params: Promise<{ recordingId: string }> }) {
  const { recordingId } = await params;
  const auth = await requireAuthForPage();

  let data;
  try {
    data = await getRecordingDetails(auth.userId, recordingId);
  } catch {
    notFound();
  }

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Recording Review</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-900">{data.recording.file_name}</h3>
        <p className="mt-2 text-sm text-slate-600">{data.recording.description || "No description"}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>Local time: {formatLocalDateTime(data.recording.recorded_at)}</span>
          <span>London bucket: {data.recording.date_bucket_london}</span>
          {data.recording.speaking_with ? <span>With: {data.recording.speaking_with}</span> : null}
        </div>
      </header>

      <RecordingPlayer recordingId={data.recording.id} initialAnnotations={data.annotations} />
    </section>
  );
}
