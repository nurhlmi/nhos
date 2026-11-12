# nhOS – Personal Command Center

A private, single-owner dashboard for exchange rates, personal assets, CVE monitoring, technology news and CV management.

**Stack:** Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui · Supabase (Postgres, Auth, Storage, RLS) · TanStack Query · React Hook Form + Zod · Recharts · date-fns · pnpm

---

## Modules

| Module | What it does | Data source |
|---|---|---|
| **Overview** | Greeting and live clock, currency, asset, CVE and news widgets, quick access. Widgets can be reordered or hidden (saved per user). | All modules below |
| **Currency Exchange** | Converter with swap, rate board (USD, EUR, SGD, JPY, GBP, AUD, CNY, MYR → IDR), history chart (1D–1Y), personal watchlist. | [Frankfurter](https://frankfurter.dev) (ECB reference rates) |
| **Asset Management** | Asset CRUD with image upload, cost by category chart, filters and pagination. | Supabase |
| **CVE Monitoring** | Latest CVEs (newest first), filters by severity, date range, vendor, product and CVSS score, CVE detail, KEV flag and due dates, watchlist with notes and review status. | [NIST NVD API 2.0](https://nvd.nist.gov/developers/vulnerabilities), [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) |
| **Technology News** | 19 publisher RSS/Atom feeds across 8 categories, filters, preview sheet, bookmarks and read-later. | Publisher feeds (see `src/features/news/feeds.ts`) |
| **CV Builder** | Personal info, experience, education, skills, projects and certifications. Multiple CV versions, 3 templates (Modern Minimalist, ATS Friendly, Developer Portfolio), section reorder and show/hide, live A4 preview, print and PDF export. | Supabase |
| **Settings** | Profile, time zone, theme, dashboard layout, data sources. | Supabase |

### About the external data

- **Nothing is made up.** If a source is down, the UI shows an error or "unavailable" state. Every widget that uses external data shows its source, when nhOS fetched it, and whether it is *live*, *cached* or *stale*.
- **Exchange rates** are ECB daily reference rates, published once per business day at around 16:00 CET. They are not intraday market quotes, so the 1D range compares the last two daily rates.
- **NVD** has no CVSS-score filter, so the minimum score is applied to the current page and the UI says so. Without an API key NVD allows 5 requests per 30 seconds, and nhOS queues or limits its own calls to stay under that. Setting `NVD_API_KEY` is recommended.
- **News** shows the publisher's headline, summary and image straight from its public feed, credits the source, and links to the original article. nhOS never scrapes article pages.

---

## Authentication (email verification, single owner)

- Sign-in uses **email verification only**: no password and no one-time code. On `/login` the owner enters their email, Supabase emails a **verification link**, and opening it signs the owner in. The link works once and expires after 10 minutes.
- **Only `nurhilmi.mail@gmail.com` can sign in.** The address is fixed in [`src/config/owner.ts`](src/config/owner.ts) and enforced at every layer:
  - The sign-in action only sends email to the owner address. Any other address gets the same "check your email" screen, so the form never reveals the owner address. It also uses `shouldCreateUser: false`, so signing in never creates an account.
  - Public sign-up is disabled.
  - The proxy, the Data Access Layer (`src/lib/auth.ts`) and the `/auth/callback` route all check the session email again. A session for any other email is signed out.
  - In the database (`supabase/migrations/20261112120000_initial_schema.sql`, function `enforce_single_user`), `auth.users` accepts only the owner address, holds at most one account, and does not allow the owner's email to be changed.
- To change the owner address, update `src/config/owner.ts` **and** the address in `enforce_single_user` in the migration together.
- The owner account is created once with `pnpm owner:create` and has no password.
- Every table has **Row Level Security** limited to `auth.uid() = user_id`, and `user_id` defaults to `auth.uid()`. Storage buckets are private and organised in per-user folders.

---

## Project structure

```
src/
  app/                 Routes only (thin): (auth)/login, (dashboard)/*, (print)/cv/print, api/*, auth/callback
  components/
    ui/                shadcn/ui primitives
    layout/            App shell: sidebar, topbar, breadcrumbs, ⌘K command menu, notifications, clock
    shared/            Page header, widget card, empty, error and loading states, source badge, confirm dialog, pager
    charts/            Shared chart tooltip and axis styling
  features/<module>/   Per module: components/, hooks.ts (TanStack Query), schemas.ts (Zod), types.ts, api/actions
  services/            Server-only integrations: currency.ts, nvd.ts, kev.ts, news.ts
  lib/                 Supabase clients, auth DAL, env, HTTP retry, TTL cache, rate limiter, API route wrapper
  hooks/  utils/  types/  config/
supabase/
  migrations/          Schema, RLS, triggers, storage buckets
  templates/           Sign-in email template (verification link)
scripts/               Owner creation, RLS, login, E2E, smoke and screenshot checks
```

Pages are Server Components by default, and Client Components are used only for interactive parts. External APIs are called only from server route handlers (`src/app/api/*`), so API keys never reach the browser.

---

## Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Where it is used | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + server | yes | Publishable key (`sb_publishable_…`). `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works for older projects. |
| `NEXT_PUBLIC_SITE_URL` | server | yes | Public URL of the app, used for the verification-link redirect |
| `NEXT_PUBLIC_APP_NAME` | browser + server | no | Product name in the sidebar, page titles, breadcrumbs and outgoing User-Agent. Defaults to `nhOS`. Rebuild after changing it, because `NEXT_PUBLIC_` values are inlined at build time. |
| `TMDB_API_READ_TOKEN` / `TMDB_API_KEY` | **server only** | for Movies | TMDB credentials ([get them here](https://www.themoviedb.org/settings/api)). The read token is preferred. |
| `NVD_API_KEY` | **server only** | recommended | Raises the NVD limit from 5 to 50 requests per 30 seconds ([request a key](https://nvd.nist.gov/developers/request-an-api-key)) |
| `SUPABASE_SERVICE_ROLE_KEY` | **your machine only** | once, for `owner:create` | Secret key (`sb_secret_…`) or legacy service_role key. Remove it after creating the owner, never set it on the hosting provider, and never give it a `NEXT_PUBLIC_` prefix |

---

## Setup (Supabase Cloud)

nhOS runs against a Supabase Cloud project; no local Supabase or Docker is needed. Requirements: Node 20+ and pnpm 10.

### 1. Install

```bash
pnpm install
```

```bash
cp .env.example .env.local
```

### 2. Set the owner email

Put your address in `src/config/owner.ts` **and** in the `enforce_single_user` function in `supabase/migrations/20261112120000_initial_schema.sql`. Only this address can sign in. Do this before pushing the migration.

### 3. Create the Supabase project and push the schema

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard). Note the **project ref** (the `xxxx` in `https://xxxx.supabase.co`) and the **database password**.
2. Sign the CLI in to your Supabase account:
   ```bash
   pnpm exec supabase login
   ```
3. Link this folder to the project (asks for the database password):
   ```bash
   pnpm exec supabase link --project-ref <project-ref>
   ```
4. Push the migration. It creates every table, RLS policy, trigger and the two private storage buckets:
   ```bash
   pnpm db:push
   ```

The schema is a single migration, so push it to an **empty** project. If the project already has the older migrations applied, `db push` will not match its history: reset the database first (this deletes all data), then push again:

```bash
pnpm exec supabase db reset --linked
```

### 4. Fill in `.env.local`

From the dashboard, **Project Settings → API Keys** (and **Data API** for the URL):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`), or the legacy anon key in `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` while developing, your production URL on the host |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key (`sb_secret_…`) or the legacy service_role key. Only needed for step 6. |
| `NEXT_PUBLIC_APP_NAME` | Optional, defaults to `nhOS` |
| `NVD_API_KEY`, `TMDB_API_READ_TOKEN` | Optional, see [Environment variables](#environment-variables) |

### 5. Configure Auth in the dashboard

`supabase/config.toml` only applies to a local Supabase stack, so set these by hand under **Authentication**:

- **Sign In / Providers → Email**: enabled. **Allow new users to sign up**: **off**.
- **URL Configuration**: set **Site URL** to your production URL (or `http://localhost:3000` until you deploy). Add both redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://<your-domain>/auth/callback`
- **Emails → Magic Link**: subject `Verify your email to sign in`, body = the contents of `supabase/templates/magic_link.html`. Its button links to `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`.
- **Emails → SMTP Settings**: configure your own SMTP provider. Supabase's built-in sender is heavily rate-limited.
- Optional: set the email OTP / link expiry to `600` seconds (the template says 10 minutes).

The link in the email uses **Site URL**. While Site URL is your production domain, the verification link opens production, not `localhost`. To sign in to the dev server, temporarily set Site URL to `http://localhost:3000`.

### 6. Create the owner account (once)

With `SUPABASE_SERVICE_ROLE_KEY` set in `.env.local`:

```bash
pnpm owner:create
```

Then delete `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`. The running app never uses it.

### 7. Run

```bash
pnpm dev
```

Open http://localhost:3000/login, enter the owner email and open the verification link from your inbox.

### Checks

```bash
pnpm typecheck && pnpm lint && pnpm test
```

`pnpm test:rls`, `test:login`, `test:e2e` and `test:smoke` are written for a local Supabase stack (they read Mailpit or create throwaway data) and refuse to run against a cloud project, so skip them.

### Changing the schema

Add a new file in `supabase/migrations/` (for example `pnpm exec supabase migration new <name>`), then `pnpm db:push`. The `db:start`, `db:stop`, `db:reset` and `db:types` scripts need a local stack and are not used in this setup; generate types from the cloud project instead:

```bash
pnpm exec supabase gen types typescript --linked > src/types/database.generated.ts
```

---

## Deployment (Vercel)

1. Import the repository in Vercel.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` (your production URL), and optionally `NEXT_PUBLIC_APP_NAME`, `NVD_API_KEY` and the TMDB keys. **Do not** set the service role key there.
3. Deploy, make sure **Site URL** in Supabase is the production URL, and sign in at `https://<your-domain>/login`.

Other Node hosts work too:

```bash
pnpm build && pnpm start
```

### Caching notes

API responses are cached in memory per server instance: rates for 30 minutes, NVD searches for 10 minutes, CVE details for 1 hour, KEV for 6 hours, and news feeds for 20 minutes. If a source fails and an earlier copy exists, the last good copy is served and marked *stale*. TanStack Query adds client-side caching and limited retries, and it honours `Retry-After`.

---

## Adding a module

1. Add a route in `src/app/(dashboard)/<module>/page.tsx` and a nav item in `src/config/navigation.ts`.
2. Put components, hooks, schemas and types in `src/features/<module>/`.
3. Put third-party calls in `src/services/<name>.ts` (`server-only`), exposed through `src/app/api/<module>/*` using `apiRoute()`.
4. Add a migration with RLS for any new table.
