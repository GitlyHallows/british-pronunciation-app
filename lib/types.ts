export type SectionType = "struggle" | "misc";
export type AnnotationColor = "red" | "green";

export type Struggle = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
};

export type PracticeSet = {
  id: string;
  user_id: string;
  section_type: SectionType;
  struggle_id: string | null;
  date_bucket_london: string;
  set_index: number;
  title: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export type PracticeCard = {
  id: string;
  set_id: string;
  order_index: number;
  sentence: string;
  ipa: string;
  stress_map: string;
  intonation_text: string;
  contour_pattern: string;
  created_at: string;
};

export type PracticeCardTag = {
  card_id: string;
  struggle_id: string;
  created_at: string;
};

export type PracticeSetPreviewCardItem = {
  id: string;
  order_index: number;
  sentence: string;
};

export type PracticeSetPreviewResponse = {
  set_id: string;
  cards: PracticeSetPreviewCardItem[];
  total_cards: number;
};

export type Recording = {
  id: string;
  user_id: string;
  recorded_at: string;
  date_bucket_london: string;
  description: string;
  speaking_with: string;
  duration_sec: number | null;
  s3_key: string;
  file_name: string;
  mime_type: string;
  bytes: number;
  created_at: string;
  updated_at: string;
};

export type RecordingAnnotation = {
  id: string;
  recording_id: string;
  start_sec: number;
  end_sec: number;
  color: AnnotationColor;
  comment: string;
  created_at: string;
  updated_at: string;
};

export type LearningSection = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  position: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};
