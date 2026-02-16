import { z } from "zod";

const supabasePublicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20)
});

const supabaseServerSchema = supabasePublicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ALLOWED_EMAILS: z.string().default("lalit.hilmarsh@gmail.com")
});

const awsSchema = z.object({
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_S3_PRESIGN_TTL_SECONDS: z.coerce.number().positive().default(3600)
});

const appSchema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000")
});

let parsedSupabasePublic: z.infer<typeof supabasePublicSchema> | null = null;
let parsedSupabaseServer: z.infer<typeof supabaseServerSchema> | null = null;
let parsedAws: z.infer<typeof awsSchema> | null = null;
let parsedApp: z.infer<typeof appSchema> | null = null;

function parseWith<T extends z.ZodTypeAny>(schema: T, source: NodeJS.ProcessEnv): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Invalid environment variables:\n${issues.join("\n")}`);
  }
  return result.data;
}

export function getSupabasePublicEnv() {
  if (!parsedSupabasePublic) {
    parsedSupabasePublic = parseWith(supabasePublicSchema, process.env);
  }
  return parsedSupabasePublic;
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseServerEnv() {
  if (!parsedSupabaseServer) {
    parsedSupabaseServer = parseWith(supabaseServerSchema, process.env);
  }
  return parsedSupabaseServer;
}

export function getAwsEnv() {
  if (!parsedAws) {
    parsedAws = parseWith(awsSchema, process.env);
  }
  return parsedAws;
}

export function getAppEnv() {
  if (!parsedApp) {
    parsedApp = parseWith(appSchema, process.env);
  }
  return parsedApp;
}

export function getAllowedEmails(): string[] {
  return getSupabaseServerEnv()
    .ALLOWED_EMAILS.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}
