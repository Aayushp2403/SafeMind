# SafeMind Supabase Setup

## 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com/).

## 2. Add the ratings table and functions

Open the Supabase SQL editor and run [supabase-setup.sql](/Users/aayushpatel/Desktop/Projects/SafeMind/supabase-setup.sql) after replacing:

- `REPLACE_WITH_OWNER_EMAIL` with the email address that should be allowed to view the owner dashboard

If you already ran an older version of the SQL, run the updated file again. It replaces the direct table upsert flow with a secure RPC write path for ratings.

## 3. Configure Auth redirect URLs

In Supabase, go to `Authentication -> URL Configuration`.

Set:

- Site URL: `https://aayushp2403.github.io/SafeMind/`
- Additional Redirect URL: `https://aayushp2403.github.io/SafeMind/owner.html`

## 4. Add your public project credentials

Open [supabase-config.js](/Users/aayushpatel/Desktop/Projects/SafeMind/supabase-config.js) and fill in:

- `url`: your Supabase project URL
- `anonKey`: your Supabase publishable/anon key

These are safe to expose in the frontend as long as Row Level Security stays enabled.

## 5. Deploy to GitHub Pages

Commit and push the updated files. Once GitHub Pages republishes, the homepage rating widget will save to Supabase and the owner dashboard will work from:

- `https://aayushp2403.github.io/SafeMind/owner.html`

## 6. Use the owner dashboard

Open the owner dashboard, enter the owner email address, and request a magic link.

After signing in through the email link, the dashboard loads the saved rating summary.

## Notes

- This setup stores one anonymous rating per browser/device using a local visitor ID.
- Supabase magic-link emails are rate limited. If you see `429 Too Many Requests`, wait at least 60 seconds before requesting another email.
- Because visitors submit ratings directly from the browser, someone determined could still spam ratings with many devices or cleared storage. If you later want, we can add hCaptcha or Turnstile to reduce abuse.
