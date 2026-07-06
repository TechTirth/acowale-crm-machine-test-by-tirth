// Fixed-window rate limiter keyed by client IP.
//
// This is an in-memory implementation: simple, dependency-free, and correct
// for a single instance. It is intentionally NOT distributed — see DECISIONS.md
// ("what would break at 100k users"). In multi-instance production you'd back
// this with Redis/Upstash using the same interface.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export type RateOptions = { max?: number; windowMs?: number };

// Env is read per-call (not at module load) so config is deterministic in
// tests and picks up runtime env in production. Callers may also override.
function config(opts?: RateOptions) {
  const max = opts?.max ?? Number(process.env.RATE_LIMIT_MAX ?? 10);
  const windowMs = opts?.windowMs ?? Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  return { max, windowMs };
}

export function rateLimit(key: string, opts?: RateOptions): RateResult {
  const { max, windowMs } = config(opts);
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: max - 1, resetAt };
  }

  existing.count += 1;
  const ok = existing.count <= max;
  return {
    ok,
    remaining: Math.max(0, max - existing.count),
    resetAt: existing.resetAt,
  };
}

// Opportunistic cleanup so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}, Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000)).unref?.();

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
