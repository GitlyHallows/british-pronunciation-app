import fs from "node:fs";
import path from "node:path";
import {
  getAdminClient,
  getRepoRoot,
  getTargetUserId,
  parseStrugglesMarkdown,
  requireEnv
} from "./_common";
import { toLondonDateBucket } from "../lib/time";
import type { PracticeCard } from "../lib/types";

const DEFAULT_CARD_COUNT = 50;
const DEFAULT_SOURCE = "codex-variety";

const SUBJECTS = [
  "Riya",
  "David",
  "Leandro",
  "Mira",
  "Vera",
  "Caleb",
  "Nora",
  "Ravi",
  "Lena",
  "Marcus",
  "Sonia",
  "Arjun"
];

const ACTIONS = [
  "practised",
  "repeated",
  "rehearsed",
  "drilled",
  "tracked",
  "refined",
  "stabilised",
  "recorded"
];

const CONTEXTS = [
  "during the warm-up",
  "before the review call",
  "in the evening speaking drill",
  "while shadowing at natural speed",
  "in a one-breath repetition",
  "before recording a voice note",
  "while reading a short passage",
  "in the final fluency round"
];

type FocusProfileId =
  | "d_our_linking"
  | "dark_l_to_r"
  | "year_old_cluster"
  | "alveolar_to_v"
  | "fv_to_r"
  | "pot_after_r"
  | "stress_shift"
  | "t_to_the"
  | "e_dr_cluster"
  | "trap_medial"
  | "had_real_link"
  | "f_to_w"
  | "whose_fault"
  | "v_to_w"
  | "age_ending"
  | "lot_vowel"
  | "morning_thought"
  | "city_s_onset"
  | "brazil_r"
  | "v_labiodental"
  | "longer_lot"
  | "diphthong"
  | "tapped_r"
  | "thought_vowel"
  | "and_weak_vowel"
  | "generic";

type FocusProfile = {
  id: FocusProfileId;
  focusLabel: string;
  cues: string[];
};

const PROFILE_LIBRARY: Record<FocusProfileId, FocusProfile> = {
  d_our_linking: {
    id: "d_our_linking",
    focusLabel: "smooth final consonant linking into our",
    cues: [
      "explained our route",
      "reminded our driver",
      "guided our visitors",
      "loaded our files",
      "reviewed our notes",
      "recorded our answers",
      "shared our updates",
      "closed our order",
      "saved our results",
      "planned our evening",
      "called our manager",
      "bridged our ideas",
      "trained our voices",
      "moved our schedule",
      "edited our draft"
    ]
  },
  dark_l_to_r: {
    id: "dark_l_to_r",
    focusLabel: "dark-l to light-r release",
    cues: [
      "whole roof",
      "small room",
      "full report",
      "tall road",
      "all routes",
      "steel rail",
      "cool river",
      "final review",
      "school register",
      "hotel reception",
      "hill road",
      "old radio",
      "teal ribbon",
      "global ranking",
      "rural role"
    ]
  },
  year_old_cluster: {
    id: "year_old_cluster",
    focusLabel: "year/yod into r-cluster flow",
    cues: [
      "twenty-one-year-old runner",
      "twenty-one-year-old reader",
      "year-end review",
      "your regular report",
      "new yearly roadmap",
      "junior research role",
      "your rural route",
      "clear yearly rhythm",
      "yearly ranking results",
      "curious year-old reviewer",
      "your review round",
      "year-round reading",
      "new year report",
      "yearly reward rate",
      "your real reason"
    ]
  },
  alveolar_to_v: {
    id: "alveolar_to_v",
    focusLabel: "final t/d/l into v transitions",
    cues: [
      "robust view",
      "solid view",
      "detailed view",
      "tight view",
      "old view",
      "final view",
      "direct view",
      "stilled voice",
      "briefed version",
      "target value",
      "cold valve",
      "great viewer",
      "light vehicle",
      "quiet village",
      "strict value"
    ]
  },
  fv_to_r: {
    id: "fv_to_r",
    focusLabel: "f/v into non-tapped r",
    cues: [
      "every review",
      "very rare result",
      "favourite route",
      "fresh report",
      "vivid river",
      "for real",
      "free reader",
      "very relaxed reply",
      "first rehearsal",
      "everest route",
      "fair recording",
      "firm response",
      "five rare records",
      "vocal range",
      "final review round"
    ]
  },
  pot_after_r: {
    id: "pot_after_r",
    focusLabel: "stable pot vowel in pro-words",
    cues: [
      "process",
      "protest",
      "program",
      "progress",
      "problem",
      "proper response",
      "project log",
      "product roadmap",
      "proactive policy",
      "prompt response",
      "process board",
      "protest report",
      "program output",
      "problem-solving round",
      "project process"
    ]
  },
  stress_shift: {
    id: "stress_shift",
    focusLabel: "noun-verb stress shift with r control",
    cues: [
      "the upgrade",
      "to upgrade",
      "the transfer",
      "to transfer",
      "the record",
      "to record",
      "the replay",
      "to replay",
      "the permit",
      "to permit",
      "the update",
      "to update",
      "the import",
      "to import",
      "the export",
      "to export"
    ]
  },
  t_to_the: {
    id: "t_to_the",
    focusLabel: "clean t + the dental fricative",
    cues: [
      "about the",
      "at the",
      "get the",
      "met the",
      "read the",
      "wrote the",
      "caught the",
      "put the",
      "sent the",
      "what the",
      "felt the",
      "quit the",
      "not the",
      "light the",
      "built the"
    ]
  },
  e_dr_cluster: {
    id: "e_dr_cluster",
    focusLabel: "e vowel before dr and d-r release",
    cues: [
      "bedroom address",
      "red dress",
      "redress request",
      "desk drawer",
      "letter addressed",
      "best driver",
      "well-dressed reader",
      "edited draft",
      "freshly addressed",
      "threaded route",
      "ready driver",
      "pedestrian route",
      "headroom drift",
      "centered draft",
      "detailed redraft"
    ]
  },
  trap_medial: {
    id: "trap_medial",
    focusLabel: "stable trap vowel in medial position",
    cues: [
      "classic traffic map",
      "caption on the banner",
      "happen again",
      "camera battery",
      "rapid data panel",
      "package tracking",
      "family captain",
      "status packet",
      "annual gathering",
      "balanced pattern",
      "practice manual",
      "manager dashboard",
      "planet habitat",
      "landing passage",
      "analytics packet"
    ]
  },
  had_real_link: {
    id: "had_real_link",
    focusLabel: "light d release before r",
    cues: [
      "had real reasons",
      "had rough rules",
      "had right responses",
      "had raw reactions",
      "had reliable results",
      "had rapid revisions",
      "had ready reports",
      "had rare records",
      "had relevant remarks",
      "had robust routines",
      "had random routes",
      "had rigid rubrics",
      "had regular rehearsals",
      "had remote readers",
      "had risky requests"
    ]
  },
  f_to_w: {
    id: "f_to_w",
    focusLabel: "f to w airflow transition",
    cues: [
      "few ways",
      "fine weather",
      "full workflow",
      "fresh water",
      "safe walkway",
      "stiff wire",
      "off-white wall",
      "half-width window",
      "leafy walkway",
      "proof we won",
      "brief warning",
      "wolf whistle",
      "soft wool",
      "life without worry",
      "chief witness"
    ]
  },
  whose_fault: {
    id: "whose_fault",
    focusLabel: "closed-mouth to f release",
    cues: [
      "whose fault was that",
      "whose file was wrong",
      "whose folder failed",
      "whose feedback worked",
      "whose form was faulty",
      "whose forecast was false",
      "whose filter was weak",
      "whose frame was warped",
      "whose funnel was full",
      "whose footage was flawed",
      "whose firewall was off",
      "whose firmware failed",
      "whose feature was final",
      "whose funding was frozen",
      "whose finish was faulty"
    ]
  },
  v_to_w: {
    id: "v_to_w",
    focusLabel: "fast v to w lip reset",
    cues: [
      "have worked",
      "save water",
      "move west",
      "live well",
      "five weeks",
      "every weekend",
      "vivid weather",
      "leave work",
      "never waste",
      "cover worldwide",
      "value workflow",
      "verify the warning",
      "visual waveform",
      "very wide window",
      "virtual workspace"
    ]
  },
  age_ending: {
    id: "age_ending",
    focusLabel: "light -age ending",
    cues: [
      "voltage",
      "bandage",
      "carriage",
      "coverage",
      "cottage",
      "courage",
      "damage",
      "dosage",
      "drainage",
      "frontage",
      "image",
      "leakage",
      "lineage",
      "luggage",
      "marriage",
      "message",
      "mileage",
      "mortgage",
      "orphanage",
      "package",
      "passage",
      "postage",
      "percentage",
      "sewage",
      "shortage",
      "signage",
      "tonnage",
      "vintage"
    ]
  },
  lot_vowel: {
    id: "lot_vowel",
    focusLabel: "lot vowel quality",
    cues: [
      "shop",
      "lot",
      "clock",
      "coffee",
      "doctor",
      "problem",
      "bottle",
      "modern",
      "process",
      "project",
      "offer",
      "watch",
      "topic",
      "common",
      "locker"
    ]
  },
  morning_thought: {
    id: "morning_thought",
    focusLabel: "thought vowel in morning-type words",
    cues: [
      "morning",
      "story",
      "calling",
      "walkway",
      "ordered coffee",
      "broad corridor",
      "awful weather",
      "lawful warning",
      "short pause",
      "talk slowly",
      "saw the board",
      "forward progress",
      "autumn report",
      "cautious tone",
      "warm audience"
    ]
  },
  city_s_onset: {
    id: "city_s_onset",
    focusLabel: "voiceless s onset",
    cues: [
      "city center",
      "simple signal",
      "silent system",
      "sunny station",
      "safe city route",
      "steady sequence",
      "same schedule",
      "sudden silence",
      "cycle lane",
      "civil service",
      "clear citation",
      "selective search",
      "soft syrup",
      "social setting",
      "single sentence"
    ]
  },
  brazil_r: {
    id: "brazil_r",
    focusLabel: "br cluster with approximant r",
    cues: [
      "Brazil briefing",
      "bright bridge",
      "brief report",
      "brand refresh",
      "broad roadmap",
      "broken record",
      "brisk reading",
      "brave response",
      "brown route",
      "brewery review",
      "broadcast room",
      "branch review",
      "branded trailer",
      "breezy remark",
      "Brazil route"
    ]
  },
  v_labiodental: {
    id: "v_labiodental",
    focusLabel: "labiodental v clarity",
    cues: [
      "availability zone",
      "version update",
      "virtual viewer",
      "verify values",
      "vocal variety",
      "active server",
      "creative review",
      "driven vehicle",
      "valid voucher",
      "vision board",
      "vital volume",
      "overvalued wave",
      "visible warning",
      "value-driven work",
      "video archive"
    ]
  },
  longer_lot: {
    id: "longer_lot",
    focusLabel: "rounded lot in longer-type words",
    cues: [
      "longer wait",
      "stronger copy",
      "doctor's office",
      "proper response",
      "offer was late",
      "locker room",
      "modern project",
      "common problem",
      "honest comment",
      "online monitor",
      "shorter option",
      "longer process",
      "stronger model",
      "solid promise",
      "broad corridor"
    ]
  },
  diphthong: {
    id: "diphthong",
    focusLabel: "full diphthong movement",
    cues: [
      "gone down",
      "uploaded code",
      "in my home",
      "phone tone",
      "slow road",
      "close the file",
      "open the door",
      "load the notes",
      "low profile",
      "loud crowd",
      "down the slope",
      "go home now",
      "cold shoulder",
      "known outcome",
      "sound check"
    ]
  },
  tapped_r: {
    id: "tapped_r",
    focusLabel: "non-tapped r in connected speech",
    cues: [
      "for it to be completely cleared",
      "reaction in progress",
      "very real response",
      "careful reading",
      "rapid review",
      "ready for recording",
      "right around here",
      "carry on reading",
      "clear reason",
      "correct response",
      "recording review",
      "rare result",
      "forward reaction",
      "direct report",
      "morning rehearsal"
    ]
  },
  thought_vowel: {
    id: "thought_vowel",
    focusLabel: "thought vowel consistency",
    cues: [
      "wanted to check",
      "saw the board",
      "walk to work",
      "short call",
      "talk all morning",
      "awful storm",
      "law and order",
      "broad warning",
      "coffee was hot",
      "door was open",
      "small pause",
      "pause before talking",
      "call me shortly",
      "walk along",
      "strong thought"
    ]
  },
  and_weak_vowel: {
    id: "and_weak_vowel",
    focusLabel: "weak function-word and",
    cues: [
      "bread and butter",
      "black and white",
      "up and over",
      "day and night",
      "safe and sound",
      "slow and steady",
      "firm and fair",
      "clear and concise",
      "short and sweet",
      "calm and ready",
      "quick and clean",
      "warm and welcoming",
      "known and trusted",
      "soft and subtle",
      "simple and useful"
    ]
  },
  generic: {
    id: "generic",
    focusLabel: "target pronunciation pattern",
    cues: [
      "clear rhythm",
      "steady airflow",
      "light consonant release",
      "stable vowel quality",
      "smooth linking",
      "controlled stress",
      "clean onset",
      "easy transition",
      "natural pacing",
      "precise ending"
    ]
  }
};

type Options = {
  strugglesPath: string;
  dateBucketLondon: string;
  cardCount: number;
  source: string;
};

async function main() {
  const options = parseOptions();
  const source = fs.readFileSync(options.strugglesPath, "utf8");
  const parsedStruggles = parseStrugglesMarkdown(source);
  if (parsedStruggles.length === 0) {
    throw new Error("No struggles parsed from struggles.md");
  }

  const userEmail = requireEnv("ALLOWED_EMAILS").split(",")[0]?.trim();
  if (!userEmail) {
    throw new Error("ALLOWED_EMAILS must include at least one email");
  }

  const userId = await getTargetUserId(userEmail);
  const supabase = getAdminClient();

  const report: Array<{
    title: string;
    struggleId: string;
    setId: string;
    setIndex: number;
    cards: number;
    profile: string;
  }> = [];

  for (const struggle of parsedStruggles) {
    const struggleId = await ensureStruggle(userId, struggle.title, struggle.description);
    const generated = generateVarietyCards(struggle.title, struggle.description, options.cardCount);

    await deleteExistingSourceSets(userId, struggleId, options.dateBucketLondon, options.source);
    const setIndex = await nextSetIndex(userId, struggleId, options.dateBucketLondon);

    const { data: createdSet, error: createSetError } = await supabase
      .from("practice_sets")
      .insert({
        user_id: userId,
        section_type: "struggle",
        struggle_id: struggleId,
        date_bucket_london: options.dateBucketLondon,
        set_index: setIndex,
        title: "Variety Drill Deck (50)",
        source: options.source
      })
      .select("id")
      .single();

    if (createSetError) throw createSetError;

    const cards = generated.cards.map((card) => ({
      set_id: createdSet.id,
      order_index: card.order_index,
      sentence: card.sentence,
      ipa: card.ipa,
      stress_map: card.stress_map,
      intonation_text: card.intonation_text,
      contour_pattern: card.contour_pattern
    }));

    const { data: insertedCards, error: insertCardsError } = await supabase
      .from("practice_cards")
      .insert(cards)
      .select("id");

    if (insertCardsError) {
      await supabase.from("practice_sets").delete().eq("id", createdSet.id);
      throw insertCardsError;
    }

    const tags = (insertedCards ?? []).map((row) => ({
      card_id: row.id,
      struggle_id: struggleId
    }));

    if (tags.length > 0) {
      const { error: tagsError } = await supabase.from("practice_card_tags").insert(tags);
      if (tagsError) throw tagsError;
    }

    report.push({
      title: struggle.title,
      struggleId,
      setId: createdSet.id,
      setIndex,
      cards: generated.cards.length,
      profile: generated.profile.id
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dateBucketLondon: options.dateBucketLondon,
        setsCreated: report.length,
        cardsPerSet: options.cardCount,
        totalCards: report.reduce((sum, entry) => sum + entry.cards, 0),
        report
      },
      null,
      2
    )
  );
}

function parseOptions(): Options {
  const repoRoot = getRepoRoot();
  const defaultStrugglesPath = path.resolve(repoRoot, "struggles.md");
  let strugglesPath = defaultStrugglesPath;
  let dateBucketLondon = toLondonDateBucket(new Date());
  let cardCount = DEFAULT_CARD_COUNT;
  let source = DEFAULT_SOURCE;

  for (const token of process.argv.slice(2)) {
    if (!token.startsWith("--")) {
      strugglesPath = path.resolve(process.cwd(), token);
      continue;
    }

    if (token.startsWith("--date=")) {
      const raw = token.slice("--date=".length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        throw new Error(`Invalid --date format: ${raw}. Expected YYYY-MM-DD`);
      }
      dateBucketLondon = raw;
      continue;
    }

    if (token.startsWith("--count=")) {
      const raw = Number(token.slice("--count=".length));
      if (!Number.isInteger(raw) || raw <= 0) {
        throw new Error(`Invalid --count value: ${token}`);
      }
      cardCount = raw;
      continue;
    }

    if (token.startsWith("--source=")) {
      source = token.slice("--source=".length).trim() || DEFAULT_SOURCE;
      continue;
    }
  }

  if (!fs.existsSync(strugglesPath)) {
    throw new Error(`struggles.md not found at ${strugglesPath}`);
  }

  return { strugglesPath, dateBucketLondon, cardCount, source };
}

async function ensureStruggle(userId: string, title: string, description: string) {
  const supabase = getAdminClient();

  const { data: existing, error: findError } = await supabase
    .from("struggles")
    .select("id")
    .eq("user_id", userId)
    .eq("title", title)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from("struggles")
    .insert({
      user_id: userId,
      title,
      description,
      status: "active"
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

async function nextSetIndex(userId: string, struggleId: string, dateBucketLondon: string) {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("practice_sets")
    .select("set_index")
    .eq("user_id", userId)
    .eq("section_type", "struggle")
    .eq("struggle_id", struggleId)
    .eq("date_bucket_london", dateBucketLondon)
    .order("set_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.set_index ?? 0) + 1;
}

async function deleteExistingSourceSets(
  userId: string,
  struggleId: string,
  dateBucketLondon: string,
  source: string
) {
  const supabase = getAdminClient();

  const { data: existing, error: findError } = await supabase
    .from("practice_sets")
    .select("id")
    .eq("user_id", userId)
    .eq("section_type", "struggle")
    .eq("struggle_id", struggleId)
    .eq("date_bucket_london", dateBucketLondon)
    .eq("source", source);

  if (findError) throw findError;
  if (!existing || existing.length === 0) return;

  const ids = existing.map((row) => row.id);
  const { error: deleteError } = await supabase.from("practice_sets").delete().in("id", ids);
  if (deleteError) throw deleteError;
}

function generateVarietyCards(
  title: string,
  description: string,
  count: number
): {
  profile: FocusProfile;
  cards: Array<Omit<PracticeCard, "id" | "set_id" | "created_at">>;
} {
  const profile = resolveProfile(title, description);
  const extraCues = extractQuotedCues(description);
  const cuePool = dedupe([...profile.cues, ...extraCues]).filter(Boolean);

  if (cuePool.length < 4) {
    cuePool.push(...PROFILE_LIBRARY.generic.cues);
  }

  const cards: Array<Omit<PracticeCard, "id" | "set_id" | "created_at">> = [];
  const seen = new Set<string>();

  let attempt = 0;
  while (cards.length < count && attempt < count * 40) {
    const subject = SUBJECTS[attempt % SUBJECTS.length];
    const action = ACTIONS[(attempt * 3 + 1) % ACTIONS.length];
    const context = CONTEXTS[(attempt * 5 + 2) % CONTEXTS.length];
    const cueA = cuePool[attempt % cuePool.length];
    let cueB = cuePool[(attempt * 7 + 3) % cuePool.length];
    if (cueA === cueB) {
      cueB = cuePool[(attempt * 11 + 5) % cuePool.length];
    }

    const sentence = buildSentence({
      index: attempt,
      subject,
      action,
      context,
      cueA,
      cueB,
      focusLabel: profile.focusLabel
    });

    if (!seen.has(sentence)) {
      seen.add(sentence);
      cards.push({
        order_index: cards.length,
        sentence,
        ipa: `/seed/${profile.id}/${cards.length + 1}/`,
        stress_map: toStressMap(sentence, cueA, cueB),
        intonation_text: `↑→ ${subject} ${action} ${cueA} / ↗ then ${cueB} / ↘ keep ${profile.focusLabel} stable`,
        contour_pattern: cards.length % 2 === 0 ? "rise_fall" : "steady"
      });
    }

    attempt += 1;
  }

  while (cards.length < count) {
    const fallbackIndex = cards.length;
    const cueA = cuePool[fallbackIndex % cuePool.length];
    const cueB = cuePool[(fallbackIndex * 3 + 1) % cuePool.length];
    const subject = SUBJECTS[fallbackIndex % SUBJECTS.length];
    const sentence = `${subject} repeated ${cueA}, then ${cueB}, in take ${fallbackIndex + 1} to lock the pattern.`;

    if (seen.has(sentence)) {
      continue;
    }

    seen.add(sentence);
    cards.push({
      order_index: fallbackIndex,
      sentence,
      ipa: `/seed/${profile.id}/${fallbackIndex + 1}/`,
      stress_map: toStressMap(sentence, cueA, cueB),
      intonation_text: `↑→ ${subject} repeated ${cueA} / ↗ then ${cueB} / ↘ keep ${profile.focusLabel} stable`,
      contour_pattern: fallbackIndex % 2 === 0 ? "rise_fall" : "steady"
    });
  }

  return { profile, cards };
}

function resolveProfile(title: string, description: string): FocusProfile {
  const text = `${title} ${description}`.toLowerCase();

  if (/(final \/d\/.*our|explained our|reminded our|\/aʊə\/|linking final \/d\/)/.test(text)) {
    return PROFILE_LIBRARY.d_our_linking;
  }
  if (/(whole roof|dark \/ɫ\/|from dark .* to approximant .* roof)/.test(text)) {
    return PROFILE_LIBRARY.dark_l_to_r;
  }
  if (/(21 year old|\/j\/ \+ \/r\/ cluster|year old)/.test(text)) {
    return PROFILE_LIBRARY.year_old_cluster;
  }
  if (/(final \/t d l\/ into .*\/v\/|robust view)/.test(text)) {
    return PROFILE_LIBRARY.alveolar_to_v;
  }
  if (/(after \/f\/ or \/v\/.*tap \/r\/|every.*everest|\/f\/ or \/v\/.*approximant)/.test(text)) {
    return PROFILE_LIBRARY.fv_to_r;
  }
  if (/(stress-flip|noun.*verb|ˈup-grade|up-ˈgrade|ˈtrans-fer|trans-ˈfer|upgrade|transfer)/.test(text)) {
    return PROFILE_LIBRARY.stress_shift;
  }
  if (/(about the|\/t\/.*,.*\/ð\/|instead of \/d\/)/.test(text)) {
    return PROFILE_LIBRARY.t_to_the;
  }
  if (/(bedroom|address|redress|\/d\/ \+ \/r\/|\/e\/ before .*\/dr\/)/.test(text)) {
    return PROFILE_LIBRARY.e_dr_cluster;
  }
  if (/(\/æ\/|caption|happen|classic|traffic|trap vowel)/.test(text)) {
    return PROFILE_LIBRARY.trap_medial;
  }
  if (/(had real|function-word .*had|\/d\/ to weaken or drop)/.test(text)) {
    return PROFILE_LIBRARY.had_real_link;
  }
  if (/(pot vowel|process|protest|pro- words|program)/.test(text)) {
    return PROFILE_LIBRARY.pot_after_r;
  }
  if (/\/f\/ \+ \/w\/|lot of ways|drop \/f\/ or turn \/w\/ into \/v\//.test(text)) {
    return PROFILE_LIBRARY.f_to_w;
  }
  if (/whose fault was that|closed-mouth position feels hard/.test(text)) {
    return PROFILE_LIBRARY.whose_fault;
  }
  if (/\/v\/ \+ \/w\/|have worked on it|fail to round into \/w\//.test(text)) {
    return PROFILE_LIBRARY.v_to_w;
  }
  if (/voltage|final “-age” is light|syllable reduction.*age/.test(text)) {
    return PROFILE_LIBRARY.age_ending;
  }
  if (/used indian vowel in .*and|indian vowel in .*and/.test(text)) {
    return PROFILE_LIBRARY.and_weak_vowel;
  }
  if (/“longer” used|\/ˈlɒŋɡə\/|longer/.test(text)) {
    return PROFILE_LIBRARY.longer_lot;
  }
  if (/“shop” landed|indian .*\/aː\/|lot vowel/.test(text)) {
    return PROFILE_LIBRARY.lot_vowel;
  }
  if (/“morning”|\/ˈmɔːnɪŋ\/|thought vowel plus/.test(text)) {
    return PROFILE_LIBRARY.morning_thought;
  }
  if (/“city” lost|voiceless \/s\/ onset/.test(text)) {
    return PROFILE_LIBRARY.city_s_onset;
  }
  if (/“brazil” carried|trilled \/r\//.test(text)) {
    return PROFILE_LIBRARY.brazil_r;
  }
  if (/availability zone|telugu .*\/ʋ\/|labiodental/.test(text)) {
    return PROFILE_LIBRARY.v_labiodental;
  }
  if (/missed diphthong|gone down|uploaded the cream|in my home/.test(text)) {
    return PROFILE_LIBRARY.diphthong;
  }
  if (/tapped \/r\/|for it to be completely cleared|reaction/.test(text)) {
    return PROFILE_LIBRARY.tapped_r;
  }
  if (/missed thought|wanted to check|saw/.test(text)) {
    return PROFILE_LIBRARY.thought_vowel;
  }

  return PROFILE_LIBRARY.generic;
}

function extractQuotedCues(description: string): string[] {
  const cues: string[] = [];
  const regex = /["“]([^"”]{2,80})["”]/g;

  let match: RegExpExecArray | null = regex.exec(description);
  while (match) {
    const cleaned = match[1]
      .replace(/[()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned && cleaned.split(" ").length <= 6) {
      cues.push(cleaned.toLowerCase());
    }
    match = regex.exec(description);
  }

  return cues;
}

function buildSentence(params: {
  index: number;
  subject: string;
  action: string;
  context: string;
  cueA: string;
  cueB: string;
  focusLabel: string;
}) {
  const { index, subject, action, context, cueA, cueB, focusLabel } = params;
  const template = index % 8;

  if (template === 0) {
    return `${subject} ${action} ${cueA} and then ${cueB} ${context}.`;
  }
  if (template === 1) {
    return `During this round, ${subject} kept ${cueA} smooth before repeating ${cueB} ${context}.`;
  }
  if (template === 2) {
    return `${subject} read ${cueA} aloud, followed it with ${cueB}, and checked ${focusLabel} ${context}.`;
  }
  if (template === 3) {
    return `${subject} switched from ${cueA} to ${cueB} ${context} without pausing.`;
  }
  if (template === 4) {
    return `In one breath, ${subject} said ${cueA}, then ${cueB}, to lock in ${focusLabel} ${context}.`;
  }
  if (template === 5) {
    return `${subject} repeated ${cueA} at slow speed, then delivered ${cueB} at natural speed ${context}.`;
  }
  if (template === 6) {
    return `For clarity, ${subject} alternated ${cueA} with ${cueB} ${context}.`;
  }
  return `${subject} finished the drill by using ${cueA} and ${cueB} ${context}.`;
}

function toStressMap(sentence: string, cueA: string, cueB: string) {
  const stressed = sentence.replace(/[.,!?]/g, "");
  const emphasize = dedupe(
    [...cueA.split(/\s+/), ...cueB.split(/\s+/)].map((word) =>
      word
        .toLowerCase()
        .replace(/[^a-z0-9'-]/gi, "")
        .trim()
    )
  ).filter((word) => word.length > 2);

  let result = stressed;
  for (const word of emphasize) {
    const pattern = new RegExp(`\\b${escapeRegex(word)}\\b`, "gi");
    result = result.replace(pattern, (token) => token.toUpperCase());
  }
  return result;
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dedupe(values: string[]) {
  return Array.from(new Set(values));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
