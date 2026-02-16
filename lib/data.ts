import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PracticeCard, PracticeSet, Recording, RecordingAnnotation, Struggle } from "@/lib/types";

export async function getStrugglesForUser(userId: string): Promise<Struggle[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("struggles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Struggle[];
}

export async function getStrugglesWithSetCounts(userId: string) {
  const [struggles, sets] = await Promise.all([
    getStrugglesForUser(userId),
    (async () => {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("practice_sets")
        .select("id, struggle_id")
        .eq("user_id", userId)
        .eq("section_type", "struggle");

      if (error) {
        throw error;
      }
      return data ?? [];
    })()
  ]);

  const countByStruggle = new Map<string, number>();
  for (const item of sets) {
    if (!item.struggle_id) continue;
    countByStruggle.set(item.struggle_id, (countByStruggle.get(item.struggle_id) ?? 0) + 1);
  }

  return struggles.map((struggle) => ({
    ...struggle,
    set_count: countByStruggle.get(struggle.id) ?? 0
  }));
}

export async function getPracticeSetsForStruggle(userId: string, struggleId: string): Promise<PracticeSet[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("practice_sets")
    .select("*")
    .eq("user_id", userId)
    .eq("section_type", "struggle")
    .eq("struggle_id", struggleId)
    .order("date_bucket_london", { ascending: false })
    .order("set_index", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as PracticeSet[];
}

export async function getMiscPracticeSets(userId: string): Promise<PracticeSet[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("practice_sets")
    .select("*")
    .eq("user_id", userId)
    .eq("section_type", "misc")
    .order("date_bucket_london", { ascending: false })
    .order("set_index", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as PracticeSet[];
}

export async function getSetDetails(userId: string, setId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: setData, error: setError } = await supabase
    .from("practice_sets")
    .select("*, struggles(id, title)")
    .eq("id", setId)
    .eq("user_id", userId)
    .single();

  if (setError) {
    throw setError;
  }

  const { data: cards, error: cardsError } = await supabase
    .from("practice_cards")
    .select("*")
    .eq("set_id", setId)
    .order("order_index", { ascending: true });

  if (cardsError) {
    throw cardsError;
  }

  const cardIds = (cards ?? []).map((card) => card.id);
  let tags: Array<{ card_id: string; struggle_id: string; struggles: { id: string; title: string } | null }> = [];

  if (cardIds.length > 0) {
    const { data: tagData, error: tagError } = await supabase
      .from("practice_card_tags")
      .select("card_id, struggle_id, struggles(id, title)")
      .in("card_id", cardIds);

    if (tagError) {
      throw tagError;
    }
    tags = (tagData ?? []).map((row: any) => ({
      card_id: row.card_id,
      struggle_id: row.struggle_id,
      struggles: Array.isArray(row.struggles) ? row.struggles[0] ?? null : row.struggles ?? null
    }));
  }

  return {
    set: setData as PracticeSet & { struggles?: { id: string; title: string } | null },
    cards: (cards ?? []) as PracticeCard[],
    tags
  };
}

export async function getRecordingsForUser(userId: string): Promise<Recording[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Recording[];
}

export async function getRecordingDetails(userId: string, recordingId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: recording, error: recordingError } = await supabase
    .from("recordings")
    .select("*")
    .eq("id", recordingId)
    .eq("user_id", userId)
    .single();

  if (recordingError) {
    throw recordingError;
  }

  const { data: annotations, error: annotationError } = await supabase
    .from("recording_annotations")
    .select("*")
    .eq("recording_id", recordingId)
    .order("start_sec", { ascending: true });

  if (annotationError) {
    throw annotationError;
  }

  return {
    recording: recording as Recording,
    annotations: (annotations ?? []) as RecordingAnnotation[]
  };
}
