# VYBE — production-ready global event platform starter

## Stack
Next.js + Supabase Auth/Postgres + Vercel. Supabase's Free plan currently includes two free projects, 500 MB database/project, 50,000 MAU, 1 GB storage and 500,000 Edge Function invocations. Vercel also has a free tier, subject to usage limits.

## Setup
1. Create a Supabase project.
2. In SQL Editor, run `supabase/schema.sql`.
3. Enable email/password authentication.
4. Copy Supabase URL and anon key into `.env.local` based on `.env.example`.
5. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL.
6. Set `CRON_SECRET` to a long random value.
7. Run `npm install && npm run dev` locally, or import this repository into Vercel.
8. Add the same environment variables in Vercel and deploy.

## Event expiry
Every event is assigned `expires_at = starts_at + 24 hours`. The Vercel cron endpoint deletes expired events hourly. It requires `Authorization: Bearer $CRON_SECRET`.

## Production notes
- Add a server-side admin role and protected admin routes before using an admin console.
- Add a transactional email provider for ticket emails.
- Add a payment provider only when paid tickets are needed.
- Add storage policies if organizers upload images directly to Supabase Storage.
