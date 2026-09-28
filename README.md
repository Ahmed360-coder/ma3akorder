# M3akOrder · معاك أوردر

Food and local-shop ordering for Egypt. Next.js + TypeScript + Tailwind on the front, Supabase (Postgres, Auth, Realtime) on the back. Dark theme, Arabic and English.

## What's built so far (milestones 0 and 1)

- Dark, mobile-first web app in Arabic (right-to-left) and English, with a language switch.
- Installable on phones (web app manifest and icon).
- Sign in with email and password, Google, or phone code.
- First-time users pick an account type: customer, business owner or driver. Businesses and drivers wait for admin approval.
- Database: profiles, businesses, menu categories, items (with stock and unit size), addresses, drivers, orders, order items, order events (a log of every status change), payments, ratings.
- Row Level Security on every table, tested: users only see their own data, stores can't approve themselves, nobody can make themselves admin.

## Run it on your computer

You need [Node.js 20 or newer](https://nodejs.org) installed.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Supabase settings to change by hand

Open your project at https://supabase.com/dashboard, then:

1. **Allow the app's address.** Authentication → URL Configuration. Set *Site URL* to `http://localhost:3000` for now, and add `http://localhost:3000/**` under *Redirect URLs*. When the site goes live, add its address the same way.
2. **Google sign-in (free).** Authentication → Sign In / Providers → Google → turn it on. It asks for a Client ID and Secret from Google Cloud; the page links to Google's step-by-step guide.
3. **Phone codes (costs money per SMS, do this later).** Authentication → Sign In / Providers → Phone → pick an SMS provider such as Twilio and paste its keys. Until then the phone tab shows an error, so use email or Google.
4. **Make yourself admin.** Sign up in the app first, then open SQL Editor and run:
   ```sql
   update public.profiles set role = 'admin', approval_status = 'approved'
   where email = 'YOUR-EMAIL-HERE';
   ```

## Database changes

Every change to the database lives in `supabase/migrations`, in order. They have already been applied to the project's Supabase database.

## Folder map

- `src/app`: pages (home, login, onboarding, account)
- `src/lib/supabase`: Supabase clients for the browser, the server and the middleware
- `src/lib/i18n`: Arabic and English text
- `supabase/migrations`: database tables and security rules
