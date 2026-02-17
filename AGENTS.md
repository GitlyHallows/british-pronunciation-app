# AGENTS Guide - british-pronunciation-app

This file is for any future agent working on this app.

## Product intent
- Private Modern RP pronunciation practice app for one allowlisted user.
- Smooth SPA-like UX (no full-page reload feel during normal navigation).
- Main sections:
- Learning (scaffolded for future content).
- Practice > Struggles (each struggle has independent date buckets and set numbering).
- Practice > Miscellaneous (cross-struggle sets, including PDF-style decks).
- Practice > Recordings (upload, playback, timestamp-range annotations, delete).

## Stack
- Next.js App Router + TypeScript + Tailwind.
- Supabase Auth + Postgres.
- AWS S3 for recording storage and presigned URLs.

## Non-negotiable domain rules
- Date policy:
- Canonical DB grouping date is London time (`date_bucket_london`, Europe/London).
- UI displays local device timezone.
- Auth model:
- Google OAuth via Supabase.
- Access is enforced by `ALLOWED_EMAILS` allowlist.
- Data ownership:
- Every table is user-owned (RLS and server checks).

## Core schema concepts
- `practice_sets`
- `section_type`: `struggle | misc`
- `date_bucket_london`: canonical grouping
- `set_index`: per-day numbering inside each section (and per struggle for struggle sets)
- `practice_cards`
- ordered by `order_index`
- fields include `sentence`, `ipa`, `stress_map`, `intonation_text`, `contour_pattern`
- `practice_card_tags`
- optional multi-tag mapping from cards to struggles
- `recordings` + `recording_annotations`
- audio metadata + timestamp-range comments (`red`/`green`)

## Sentence set style contract
When creating any new sentence set for this app, follow the same style as the existing Miscellaneous deck cards:
- Every card must include:
- `sentence`
- `ipa`
- `stress_map`
- `intonation_text`
- `contour_pattern`
- Keep output render-compatible with the existing set card UI (`SentenceCard`).

## Recent UX decisions already implemented
- Inline set previews on Misc and Struggles list pages.
- Users can expand `Preview` inside a set card without leaving the page.
- Full set opens only via explicit `Open set` button.
- Preview API: `GET /api/v1/practice-sets/:setId/preview?limit=3`
- Returns first N sentences + total count.

## Recording UX status
- Upload flow uses presigned S3 upload + completion endpoint.
- Same-file reselect upload edge case handled.
- Recording deletion supported in list and detail views.
- Delete endpoint also attempts S3 object cleanup.

## Important files
- App shell/layout/navigation:
- `components/app-shell.tsx`
- Practice tabs:
- `components/practice-tabs.tsx`
- Misc page:
- `app/(protected)/practice/misc/page.tsx`
- Struggle detail page:
- `app/(protected)/practice/struggles/[struggleId]/page.tsx`
- Set detail page:
- `app/(protected)/practice/sets/[setId]/page.tsx`
- Preview card component:
- `components/practice-set-preview-card.tsx`
- Data helpers:
- `lib/data.ts`
- Types:
- `lib/types.ts`
- Env parsing and contracts:
- `lib/env.ts`
- Seed/import scripts:
- `scripts/import-pdf-misc.ts`
- `scripts/generate-struggle-sets.ts`
- `scripts/add-practice-set.ts`

## Environment variables required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_EMAILS`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_S3_PRESIGN_TTL_SECONDS`
- `APP_URL`

## Local operations
- Install: `npm install`
- Dev: `npm run dev`
- Build check: `npm run build`
- Seed all: `npm run seed`
- Verify seed: `npm run seed:check`
- Add one custom set payload: `npm run add:set -- ./path/to/payload.json`

## Deployment notes
- GitHub repo: `GitlyHallows/british-pronunciation-app`
- Main branch: `master`
- Vercel project: `british-pronunciation-app`
- Production URL: `https://british-pronunciation-app.vercel.app`
- If login redirects to localhost in production, verify:
- Supabase Auth URL and redirect settings.
- Google OAuth redirect URIs.
- `APP_URL` in Vercel env.

## Agent guardrails
- Do not change date bucketing away from London canonical logic.
- Do not bypass allowlist checks for protected routes.
- Do not store recordings outside S3 in this architecture.
- Keep card rendering format stable unless explicitly requested.
- Avoid destructive cleanup commands unless explicitly approved.
