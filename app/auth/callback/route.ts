import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllowedEmails } from "@/lib/env";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/practice/struggles";

  if (!code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !user.email || !getAllowedEmails().includes(user.email.toLowerCase())) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?unauthorized=1", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
