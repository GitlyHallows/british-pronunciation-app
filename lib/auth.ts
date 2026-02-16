import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllowedEmails, isSupabaseConfigured } from "@/lib/env";

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

async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid environment variables")) {
      return null;
    }
    throw error;
  }
}

export async function requireAuthForPage(): Promise<AuthContext> {
  const user = await getCurrentUser();

  if (!user || !ensureAllowlisted(user.email)) {
    redirect("/login");
  }

  return { userId: user.id, email: user.email! };
}

export async function requireAuthForRoute(): Promise<AuthContext> {
  const user = await getCurrentUser();

  if (!user || !ensureAllowlisted(user.email)) {
    throw new Error("UNAUTHORIZED");
  }

  return { userId: user.id, email: user.email! };
}

export async function getOptionalAuthForPage(): Promise<AuthContext | null> {
  const user = await getCurrentUser();

  if (!user || !ensureAllowlisted(user.email)) {
    return null;
  }

  return { userId: user.id, email: user.email! };
}
