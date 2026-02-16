create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.struggles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section_type text not null check (section_type in ('struggle', 'misc')),
  struggle_id uuid references public.struggles(id) on delete set null,
  date_bucket_london date not null,
  set_index integer not null check (set_index > 0),
  title text not null,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists practice_sets_uniqueness_idx
on public.practice_sets (
  user_id,
  section_type,
  coalesce(struggle_id, '00000000-0000-0000-0000-000000000000'::uuid),
  date_bucket_london,
  set_index
);

create table if not exists public.practice_cards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.practice_sets(id) on delete cascade,
  order_index integer not null check (order_index >= 0),
  sentence text not null,
  ipa text not null,
  stress_map text not null,
  intonation_text text not null,
  contour_pattern text not null default 'rise_fall',
  created_at timestamptz not null default now(),
  unique (set_id, order_index)
);

create table if not exists public.practice_card_tags (
  card_id uuid not null references public.practice_cards(id) on delete cascade,
  struggle_id uuid not null references public.struggles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (card_id, struggle_id)
);

create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  date_bucket_london date not null,
  description text not null default '',
  speaking_with text not null default '',
  duration_sec numeric(10, 3),
  s3_key text not null,
  file_name text not null,
  mime_type text not null,
  bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recording_annotations (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references public.recordings(id) on delete cascade,
  start_sec numeric(10, 3) not null,
  end_sec numeric(10, 3) not null,
  color text not null check (color in ('red', 'green')),
  comment text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_sec > start_sec)
);

create table if not exists public.learning_sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  title text not null,
  position integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create trigger struggles_set_updated_at
before update on public.struggles
for each row execute function public.set_updated_at();

create trigger practice_sets_set_updated_at
before update on public.practice_sets
for each row execute function public.set_updated_at();

create trigger recordings_set_updated_at
before update on public.recordings
for each row execute function public.set_updated_at();

create trigger recording_annotations_set_updated_at
before update on public.recording_annotations
for each row execute function public.set_updated_at();

create trigger learning_sections_set_updated_at
before update on public.learning_sections
for each row execute function public.set_updated_at();

alter table public.struggles enable row level security;
alter table public.practice_sets enable row level security;
alter table public.practice_cards enable row level security;
alter table public.practice_card_tags enable row level security;
alter table public.recordings enable row level security;
alter table public.recording_annotations enable row level security;
alter table public.learning_sections enable row level security;

create policy "struggles_owner_all"
on public.struggles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "practice_sets_owner_all"
on public.practice_sets
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "practice_cards_owner_all"
on public.practice_cards
for all
using (
  exists (
    select 1
    from public.practice_sets ps
    where ps.id = practice_cards.set_id
      and ps.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.practice_sets ps
    where ps.id = practice_cards.set_id
      and ps.user_id = auth.uid()
  )
);

create policy "practice_card_tags_owner_all"
on public.practice_card_tags
for all
using (
  exists (
    select 1
    from public.practice_cards pc
    join public.practice_sets ps on ps.id = pc.set_id
    where pc.id = practice_card_tags.card_id
      and ps.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.practice_cards pc
    join public.practice_sets ps on ps.id = pc.set_id
    where pc.id = practice_card_tags.card_id
      and ps.user_id = auth.uid()
  )
);

create policy "recordings_owner_all"
on public.recordings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "recording_annotations_owner_all"
on public.recording_annotations
for all
using (
  exists (
    select 1
    from public.recordings r
    where r.id = recording_annotations.recording_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.recordings r
    where r.id = recording_annotations.recording_id
      and r.user_id = auth.uid()
  )
);

create policy "learning_sections_owner_all"
on public.learning_sections
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
