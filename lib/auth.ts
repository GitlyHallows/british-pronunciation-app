import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllowedEmails } from "@/lib/env";

export type AuthContext = {
  userId: string;
  email: string;
};

function ensureAllowlisted(email: string | undefined | null) {
  if (!email) {
    return false;
  }
  const allow = getAllowedEmails();
  return allow.includes(email.toLowerCase());
}

export async function requireAuthForPage(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !ensureAllowlisted(user.email)) {
    redirect("/login");
  }

  return { userId: user.id, email: user.email! };
}

export async function requireAuthForRoute(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !ensureAllowlisted(user.email)) {
    throw new Error("UNAUTHORIZED");
  }

  return { userId: user.id, email: user.email! };
}

export async function getOptionalAuthForPage(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !ensureAllowlisted(user.email)) {
    return null;
  }

  return { userId: user.id, email: user.email! };
}
