import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fromZonedTime } from "date-fns-tz";
import type { PracticeCard } from "../lib/types";
import { toLondonDateBucket } from "../lib/time";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

export function getRepoRoot() {
  return path.resolve(process.cwd(), "..");
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getAdminClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function getTargetUserId(email: string): Promise<string> {
  const client = getAdminClient();
  const { data, error } = await client.auth.admin.listUsers();
  if (error) throw error;

  const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error(`No auth user found for ${email}. Sign in once via the app before running seed.`);
  }

  return user.id;
}

export function parseStrugglesMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const struggles: Array<{ title: string; description: string }> = [];
  let currentSection = "General";

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      currentSection = line.replace(/^##\s+/, "").trim();
      continue;
    }

    if (!line.startsWith("- ")) continue;

    const body = line.replace(/^-\s+/, "").trim();
    if (!body) continue;

    const normalized = body.replace(/^\d{4}-\d{2}-\d{2}:\s*/, "").trim();
    const titleSeed = normalized.split(/[.;]/)[0]?.trim() || normalized;
    const title = `${currentSection}: ${titleSeed}`.slice(0, 180);

    struggles.push({
      title,
      description: normalized
    });
  }

  return struggles;
}

const SUBJECTS = ["Riya", "David", "Nora", "Leandro", "Marcus", "Vera", "Ravi", "Mira", "Caleb", "Lena"];
const SETTINGS = ["during the warm river walk", "before the review call", "while reading the script", "in the evening practice", "during rapid shadowing", "before the meeting", "in the speaking drill", "on the phone checkpoint", "in the recording session", "during rhythm practice"];
const VERBS = ["repeated", "rehearsed", "refined", "reviewed", "stabilized", "smoothed", "tracked", "corrected", "reworked", "strengthened"];

export function generateCardsForStruggle(struggleTitle: string, description: string, count = 20): Array<Omit<PracticeCard, "id" | "set_id" | "created_at">> {
  const focus = extractFocusPhrase(struggleTitle, description);

  const cards: Array<Omit<PracticeCard, "id" | "set_id" | "created_at">> = [];
  for (let index = 0; index < count; index += 1) {
    const subject = SUBJECTS[index % SUBJECTS.length];
    const setting = SETTINGS[index % SETTINGS.length];
    const verb = VERBS[index % VERBS.length];

    const sentence = `${subject} ${verb} ${focus} ${setting} so the phrase stayed clear and smooth.`;
    const stress = `${subject.toUpperCase()} ${verb.toUpperCase()} ${focus.toUpperCase()} ${setting.toUpperCase()} SO the PHRASE stayed CLEAR and SMOOTH`;

    cards.push({
      order_index: index,
      sentence,
      ipa: `/seed/${index + 1}/${slugForIpa(focus)}/`,
      stress_map: stress,
      intonation_text: `↑→ ${subject} ${verb} ${focus} / ↗ ${setting} / ↘ so the phrase stayed clear and smooth`,
      contour_pattern: index % 2 === 0 ? "rise_fall" : "steady"
    });
  }

  return cards;
}

function extractFocusPhrase(title: string, description: string): string {
  const joined = `${title} ${description}`.toLowerCase();

  const patterns: Array<{ regex: RegExp; replacement: string }> = [
    { regex: /linking|link/, replacement: "smooth linking between target sounds" },
    { regex: /approximant|\br\b|tapped/, replacement: "a light Modern RP approximant r" },
    { regex: /pot|\bɒ\b|lot vowel|process|protest/, replacement: "the POT vowel in pro words" },
    { regex: /walk|thought|ɔː/, replacement: "the THOUGHT vowel quality" },
    { regex: /stress|noun\/verb|shift/, replacement: "noun-verb stress contrast" },
    { regex: /dr|bedroom|address/, replacement: "clean d-r transitions" },
    { regex: /f\+w|v\+w|fault|ways/, replacement: "clean f/v to w transitions" },
    { regex: /voltage|-age/, replacement: "reduced -age endings" },
    { regex: /city|s\//, replacement: "crisp voiceless consonant starts" },
    { regex: /diphthong/, replacement: "full diphthong movement" }
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(joined)) {
      return pattern.replacement;
    }
  }

  return "the target pronunciation pattern";
}

function slugForIpa(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function parseDateTimeFromPdfTimestamp(timestamp: string) {
  const [datePart, timePart] = timestamp.split(",").map((part) => part.trim());
  if (!datePart || !timePart) {
    throw new Error(`Could not parse timestamp: ${timestamp}`);
  }

  const [day, month, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  if ([day, month, year, hour, minute].some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid timestamp numbers: ${timestamp}`);
  }

  const iso = `${year.toString().padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  const date = fromZonedTime(iso, "Europe/London");

  return {
    iso,
    londonDateBucket: toLondonDateBucket(date),
    date
  };
}

export function readFile(pathname: string) {
  return fs.readFileSync(pathname, "utf8");
}
