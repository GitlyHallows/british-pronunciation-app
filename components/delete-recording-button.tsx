"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteRecordingButtonProps = {
  recordingId: string;
  redirectTo?: string;
  label?: string;
  className?: string;
};

export function DeleteRecordingButton({
  recordingId,
  redirectTo,
  label = "Delete",
  className
}: DeleteRecordingButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    const accepted = window.confirm(
      "Delete this recording and all its annotations? This cannot be undone."
    );
    if (!accepted) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/recordings/${recordingId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to delete recording"));
      }

      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Deleting..." : label}
      </button>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
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
