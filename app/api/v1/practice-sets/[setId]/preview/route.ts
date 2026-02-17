import { z } from "zod";
import { requireAuthForRoute } from "@/lib/auth";
import { getPracticeSetPreview } from "@/lib/data";
import { fail, handleRouteError, ok } from "@/lib/http";

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).default(3)
});

export async function GET(request: Request, { params }: { params: Promise<{ setId: string }> }) {
  try {
    const { setId } = await params;
    const auth = await requireAuthForRoute();
    const url = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      limit: url.searchParams.get("limit") ?? undefined
    });

    if (!parsedQuery.success) {
      return fail("Invalid query", 400, parsedQuery.error.flatten());
    }

    const data = await getPracticeSetPreview(auth.userId, setId, parsedQuery.data.limit);

    if (!data) {
      return fail("Practice set not found", 404);
    }

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
