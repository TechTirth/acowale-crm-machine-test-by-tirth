# Engineering Decision Log

Short, honest answers to the prompt's questions.

### 1. Why this technology stack?

**Next.js 15 + TypeScript + React 19.** The task is a form, a dashboard, and
three APIs — a full-stack web app small enough that one framework owning both UI
and API removes a whole category of glue code (no separate backend service, no
CORS, no duplicated types). TypeScript gives compile-time safety end to end;
Zod-inferred types flow from the API into the client. React 19 + the App Router
let the dashboard do its auth guard on the server and hydrate only the
interactive parts. The stack is boring in the best way: it's the current default
for exactly this shape of product, so it's well-documented, hireable, and cheap
to host.

### 2. Why this database?

**PostgreSQL via Prisma.** Feedback is inherently relational and the analytics
are relational aggregations (`GROUP BY category`, counts, time windows) — SQL is
the natural fit, and Postgres does it with indexes I control. Prisma gives a
typed client, a migration history, and schema-as-code, so the DB shape lives in
version control. I picked **Neon** for hosting because it's serverless Postgres
that scales to zero — right-sized for a v1 with spiky traffic. The schema is
written to run on SQLite too, so a contributor can try the app with zero
external services.

### 3. Why structure the application this way?

Thin route handlers, thick `lib`. Every API route does the same three steps —
validate, act, respond — and delegates real logic to `src/lib` (validation,
auth, rate limiting, logging, DB). That keeps business rules **framework-free
and unit-testable** without spinning up a server, and keeps a single source of
truth for things like the category list (used by the form, the API, and
analytics). The dashboard is a server component that guards auth before any
client JS ships, with interactivity isolated in one client component.

### 4. Trade-offs made due to time constraints

- **In-memory rate limiter** instead of Redis — correct on one instance, not
  across many (see Q10).
- **Single shared admin password** instead of real user accounts — proportionate
  for an internal console, but not multi-user.
- **No E2E tests** — I unit-tested the pure logic (the highest-value, lowest-cost
  tests) and relied on manual verification for the UI flows.
- **Analytics computed live** on each request rather than cached/materialised —
  fine at current scale, wasteful at large scale.
- **Search is `ILIKE %term%`** — simple and correct, but not a real full-text
  index.

### 5. What I'd improve with one more week

Real auth (NextAuth with per-user accounts + roles), Redis-backed rate limiting
and caching, Postgres full-text search or trigram indexes, an admin action to
export CSV and to triage/tag feedback, spam protection (honeypot + a light
challenge), Playwright E2E tests in CI, and OpenTelemetry traces wired to a
dashboard. I'd also add optimistic UI and a proper empty/loading/error design
pass.

### 6. Most difficult technical challenge

Deciding how much auth is *right* rather than *maximal*. It's tempting to reach
for a full identity provider, but that adds real operational weight (user tables,
email flows, session stores) that a single-tenant internal dashboard doesn't
need yet. Getting a genuinely secure-but-minimal solution — an HMAC-signed,
httpOnly, expiring cookie with timing-safe comparison and no server-side session
store — took the most careful thought, because "simple" and "secure" usually
pull against each other and here they had to coexist.

### 7. Which AI tools did you use?

Claude (Anthropic) as a pair-programmer for scaffolding, reviewing trade-offs,
and drafting docs and tests.

### 8. One instance where AI helped

Generating the exhaustive validation-test matrix quickly — empty-string email
coercion, whitespace trimming, boundary lengths, numeric-string coercion of
query params. AI enumerated edge cases I'd have written more slowly by hand,
which then caught a real ordering bug in the rate-limiter's env handling.

### 9. One instance where I disagreed with AI

The first rate-limiter read its limits from `process.env` at *module load*. AI's
test set the env vars just before importing — which passes locally but is
fragile, because test runners hoist imports and the module can bind config
before the assignment runs (it did, and three tests failed). I disagreed with
the "set env then import" pattern and refactored the limiter to read config
per-call with an optional injected override. That's both more testable and more
correct at runtime, and the tests became deterministic.

### 10. What breaks first at 100,000 users?

The **in-memory rate limiter** breaks first *correctness*-wise: on Vercel each
serverless instance has its own memory, so the per-IP counter is per-instance —
a user hitting different instances bypasses the limit, and the map isn't shared.
Close behind, **live analytics** becomes the performance bottleneck: every
dashboard load runs `COUNT` + `GROUP BY` over the full table. Fixes, in order:
move rate limiting to Redis/Upstash (shared, atomic), cache or materialise the
analytics summary (a periodically-refreshed rollup), and add connection pooling
(PgBouncer / Neon's pooler) so serverless bursts don't exhaust DB connections.

### 11. One thing I'd improve, change, or challenge about the assignment

I'd challenge treating "feedback" as write-only. The stated value is *analysing
trends*, but a submission the team can't act on or close the loop on is data that
rots. I'd push the spec to include a lightweight lifecycle — a status
(new/triaged/resolved) and the ability to tag or link submissions — because the
product's real job isn't collecting feedback, it's turning it into decisions.
That reframes the dashboard from a report into a workflow, which is where the
actual value is.
