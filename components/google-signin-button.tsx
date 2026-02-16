"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setPending(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (authError) {
      setError(authError.message);
      setPending(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-xl bg-teal px-4 py-3 font-semibold text-white transition hover:bg-[#0f8f83] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Redirecting..." : "Continue with Google"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
