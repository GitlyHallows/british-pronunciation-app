# British Pronunciation App MVP

Private, mobile-friendly pronunciation practice web app with:
- `Learning` scaffold
- `Practice > Struggles`, `Practice > Miscellaneous`, and `Practice > Recordings`
- Google auth allowlist
- Supabase Postgres data
- AWS S3 audio storage with presigned URLs
- Timestamp-range recording annotations (red/green)
- Print/export view for each set
- Installable PWA shell

## Stack
- Next.js App Router + TypeScript + Tailwind
- Supabase Auth + Postgres + RLS
- AWS S3 (recordings)
- Wavesurfer.js regions for comment ranges

## Setup
1. Install dependencies:
```bash
cd /Users/lalit/Videos/Courses/English_with_Lucy_British_pronunciation/british-pronunciation-app
npm install
```

2. Create `.env.local` from `.env.example` and fill values.

3. Apply Supabase migration:
- Run SQL in `/Users/lalit/Videos/Courses/English_with_Lucy_British_pronunciation/british-pronunciation-app/supabase/migrations/20260216143000_init.sql`

4. Configure Supabase Google auth:
- Enable Google provider
- Set redirect URL: `http://localhost:3000/auth/callback` (and production URL)
- Keep allowlist with `lalit.hilmarsh@gmail.com`

5. Seed data:
```bash
npm run seed
```

This does:
- Import PDF card deck into `Miscellaneous` from:
  - `/Users/lalit/Downloads/Linking R & WV Practice Cards.pdf`
  - `/Users/lalit/Videos/Courses/English_with_Lucy_British_pronunciation/sentence_showcase/linking_r_vw_drills.html`
- Create every struggle from `struggles.md`
- Create one initial set per struggle on London date `2026-02-16` with 20 cards

6. Verify seed:
```bash
npm run seed:check
```

7. Run dev server:
```bash
npm run dev
```

## Date policy
- Canonical DB date bucket: `Europe/London` (`date_bucket_london`)
- UI display: device local timezone

## Add future sets via Codex script
Prepare a JSON payload and run:
```bash
npm run add:set -- ./path/to/payload.json
```

Payload shape:
```json
{
  "section_type": "struggle",
  "struggle_title": "Linking & Approximant /r/: ...",
  "date": "2026-02-17T08:12:00",
  "title": "Morning Set",
  "source": "codex",
  "cards": [
    {
      "sentence": "...",
      "ipa": "/.../",
      "stress_map": "...",
      "intonation_text": "...",
      "contour_pattern": "rise_fall",
      "struggle_titles": ["...", "..."]
    }
  ]
}
```

## Notes
- Recording files are intentionally stored in S3 for reliable scrubbing and signed playback.
- Google One storage is not used directly as object storage in this architecture.
