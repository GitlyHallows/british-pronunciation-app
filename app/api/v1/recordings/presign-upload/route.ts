import { z } from "zod";
import { requireAuthForRoute } from "@/lib/auth";
import { createUploadUrl } from "@/lib/s3";
import { fail, handleRouteError, ok } from "@/lib/http";
import { slugify } from "@/lib/utils";

const schema = z.object({
  fileName: z.string().min(1).max(260),
  mimeType: z.string().min(1).max(128),
  bytes: z.number().int().positive()
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuthForRoute();
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const now = new Date();
    const safeName = slugify(parsed.data.fileName.replace(/\.[a-z0-9]+$/i, "")) || "recording";
    const extensionMatch = parsed.data.fileName.match(/\.[a-z0-9]+$/i);
    const extension = extensionMatch ? extensionMatch[0].toLowerCase() : ".m4a";

    const key = [
      "recordings",
      auth.userId,
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      `${now.getTime()}-${safeName}${extension}`
    ].join("/");

    const presigned = await createUploadUrl({ key, contentType: parsed.data.mimeType });

    return ok({
      uploadUrl: presigned.uploadUrl,
      key,
      maxBytesAccepted: parsed.data.bytes
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
