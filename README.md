# Acowale CRM Machine Test — Feedback Platform

A lightweight customer-feedback platform. The public submits feedback through a
form; the team analyses trends through a password-protected dashboard.

> Built by **Tirth** as the Acowale machine test. This README explains *how* to
> run it and *why* it's built the way it is. See `DECISIONS.md` for the full
> engineering decision log and `TEACH_US.md` for the bonus.

---

## What it does

- **Public feedback form** (`/`) — pick a category, write a comment, optionally
  leave an email. No login required.
- **Team dashboard** (`/dashboard`) — total count, category distribution,
  recent submissions, search + category filter, pagination. Password-gated.
- **JSON APIs** — submit, fetch (filtered/paginated), and an analytics summary.

## Tech stack (one line)

Next.js 15 (App Router) · TypeScript · React 19 · Prisma · PostgreSQL · Zod ·
Vitest · deployed on Vercel + Neon. One codebase, one deploy. *Why these? →
`DECISIONS.md`.*

## Architecture

```
Browser ──► Next.js (Vercel)
             ├─ /               public form         (RSC + client form)
             ├─ /dashboard      admin console       (RSC guard + client UI)
             ├─ /login          admin sign-in
             └─ /api/*          Route Handlers
                  ├─ POST /api/feedback     submit  (public, rate-limited)
                  ├─ GET  /api/feedback     list    (admin, filter/search/page)
                  ├─ GET  /api/analytics    summary (admin)
                  ├─ POST /api/auth/login   session cookie
                  ├─ POST /api/auth/logout
                  └─ GET  /api/health       liveness + DB readiness
                            │
                            ▼  Prisma
                        PostgreSQL (Neon)
```

A **single Next.js app** owns both UI and API. `src/lib` holds framework-free
logic — validation, auth, rate limiting, logging, the Prisma client — so it's
unit-testable in isolation and reusable across routes.

```
src/
  app/
    page.tsx              public form page
    login/page.tsx        admin login
    dashboard/page.tsx    server auth guard → <Dashboard/>
    api/…                 route handlers (thin: validate → act → respond)
  components/             FeedbackForm, Dashboard, CategoryPill
  lib/                    validation, prisma, auth, logger, rate-limit
prisma/                   schema + seed
tests/                    vitest unit tests
```

---

## Run it locally

**Prerequisites:** Node 20+, and a Postgres database (use Docker below, or a free
Neon/Supabase instance).

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
#   Edit .env — at minimum set DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET.

# 3a. (Option A) Start a local Postgres with Docker
docker compose up -d
#   then set in .env:
#   DATABASE_URL="postgresql://acowale:acowale@localhost:5432/acowale?schema=public"

# 3b. (Option B) Use any hosted Postgres and paste its URL into DATABASE_URL.

# 4. Create the schema + seed sample data
npx prisma migrate dev --name init
npm run db:seed

# 5. Run
npm run dev
#   → http://localhost:3000            (public form)
#   → http://localhost:3000/dashboard  (log in with ADMIN_PASSWORD)
```

### Quick check without a database

The pure logic (validation, rate limiting) is covered by unit tests that need no
DB or network:

```bash
npm test        # 18 tests
```

> **Prisma note:** `prisma generate` downloads a query-engine binary on first
> run. In a locked-down/offline environment set
> `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`. On Vercel and normal machines this
> is automatic.

---

## Deployment

Deploys to **Vercel** from source. The database is **Neon** (serverless Postgres).

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Set env vars in Vercel → Project → Settings → Environment Variables:
   `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET` (and optionally the
   `RATE_LIMIT_*` vars).
4. Vercel runs the build command from `vercel.json`:
   `prisma generate && prisma migrate deploy && next build`.

Every push to `main` ships to production; every PR gets a preview URL. CI
(`.github/workflows/ci.yml`) runs typecheck, lint, tests, and a build on each
push/PR before merge.

---

## API reference

| Method | Path             | Auth   | Purpose                                   |
| ------ | ---------------- | ------ | ----------------------------------------- |
| POST   | `/api/feedback`  | public | Submit feedback (rate-limited per IP)     |
| GET    | `/api/feedback`  | admin  | List feedback: `?category=&search=&page=` |
| GET    | `/api/analytics` | admin  | Totals + per-category distribution        |
| POST   | `/api/auth/login`| public | Exchange password for session cookie      |
| POST   | `/api/auth/logout`| admin | Clear session                             |
| GET    | `/api/health`    | public | 200 if app + DB healthy, 503 otherwise    |

**Submit example**

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"category":"BUG","comment":"The filter resets on refresh.","email":"you@example.com"}'
# → 201 { "data": { "id": "...", "category": "BUG", "createdAt": "..." } }
```

Validation failures return `400` with per-field messages; rate-limit hits return
`429` with a `Retry-After` header.

---

## Production-readiness checklist

- **Env vars** — all secrets/config via `.env` (`.env.example` documents them).
- **Validation** — every input parsed with Zod at the boundary; DB never sees
  unvalidated data.
- **Error handling** — routes never leak stack traces; users get actionable
  messages, details go to logs.
- **Logging** — structured single-line JSON (`src/lib/logger.ts`) with request
  ids, ready for a log drain.
- **Health check** — `/api/health` verifies the DB, returns 503 when degraded.
- **Auth** — HMAC-signed httpOnly session cookie gates the dashboard + admin
  APIs.
- **Rate limiting** — per-IP fixed window on submit and login.
- **Tests** — Vitest unit tests for validation and rate limiting.
- **CI/CD** — GitHub Actions gate + Vercel deploy.

Trade-offs and what I'd harden next are in `DECISIONS.md`.
