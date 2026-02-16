import { redirect } from "next/navigation";
import { getOptionalAuthForPage } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/google-signin-button";

export default async function LoginPage() {
  const auth = await getOptionalAuthForPage();
  if (auth) {
    redirect("/practice/struggles");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-3xl border border-white/60 bg-white/85 p-8 shadow-card backdrop-blur">
        <p className="mb-3 inline-flex rounded-full border border-teal/30 bg-teal-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          Accent Practice Lab
        </p>
        <h1 className="font-[var(--font-dm-serif)] text-4xl leading-tight text-ink">
          Private Workspace Login
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Sign in with Google. Only your allowlisted email can access the app.
        </p>
        <div className="mt-6">
          <GoogleSignInButton />
        </div>
      </section>
    </main>
  );
}
