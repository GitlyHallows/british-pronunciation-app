import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return fail("Unauthorized", 401);
  }

  const message = error instanceof Error ? error.message : "Unknown server error";
  return fail(message, 500);
}
