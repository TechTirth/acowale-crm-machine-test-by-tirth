# Teach Us: The Expand/Contract migration pattern

Here's a practice that quietly prevents one of the most common production
outages: **database migrations that ship in the same deploy as the code that
needs them.**

### The trap

The obvious way to rename a column, change a type, or drop a field is one
migration + one deploy. But a deploy is never atomic. For a window of seconds to
minutes, **old code and new code run at the same time** — old instances haven't
drained, the new ones are booting, and your migration has already changed the
schema underneath both. If you `DROP COLUMN comment_text` and rename it to
`comment`, every still-running old instance throws on its next query. That's a
self-inflicted outage during what looked like a routine change.

### The pattern: Expand → Migrate → Contract

Split every breaking schema change into **three separate deploys**, each of
which is safe with *both* the previous and next version of the code running.

1. **Expand** — Add the new shape *additively*. New nullable column, new table,
   new index. Don't touch the old shape. Deploy code that **writes to both** old
   and new, but still **reads from old**. Nothing breaks: old code ignores the
   new column; new code keeps the old one populated.

2. **Migrate** — Backfill existing rows into the new shape (a background job, not
   a blocking migration). Then deploy code that **reads from new, writes to
   both**. Still reversible — the old column is intact and current.

3. **Contract** — Once you're confident (metrics, a few days, no rollbacks
   pending), deploy code that only uses the new shape, *then* drop the old
   column in a final migration. The delete is now safe because no running code
   references it.

### Why it matters for Acowale

It turns scary migrations into boring ones. Each step is independently
deployable and independently **rollback-safe**, so you never need a maintenance
window and you never gate a schema change on perfect deploy timing. The cost is
discipline — three PRs instead of one — but the payoff is that "change the
database" stops being the sentence that makes engineers nervous before a Friday.

### The one-line version

> Never let a deploy assume the schema and the code changed at the same instant —
> because they never do.

This is the same principle behind zero-downtime API versioning and feature
flags: **decouple the risky change from the moment of deploy.** Adopt it as a
team norm and a whole class of 2 a.m. pages disappears.

*(For this v1, our only migration is the initial `CREATE TABLE`, so the pattern
isn't exercised yet — but the moment the feedback model grows a `status` field,
this is how I'd ship it.)*
