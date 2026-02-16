import { requireAuthForRoute } from "@/lib/auth";
import { ok, handleRouteError } from "@/lib/http";

export async function POST() {
  try {
    const auth = await requireAuthForRoute();
    return ok({ allowed: true, userId: auth.userId, email: auth.email });
  } catch (error) {
    return handleRouteError(error);
  }
}
