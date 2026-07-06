import { describe, it, expect, beforeEach, vi } from "vitest";
import { rateLimit, clientIp, type RateOptions } from "@/lib/rate-limit";

// Small, fast window injected per call for deterministic tests.
const OPTS: RateOptions = { max: 3, windowMs: 1000 };

describe("rateLimit", () => {
  let key = "";
  beforeEach(() => {
    // Unique key per test so buckets don't leak across cases.
    key = `test-${Math.random()}`;
  });

  it("allows requests up to the limit", () => {
    expect(rateLimit(key, OPTS).ok).toBe(true);
    expect(rateLimit(key, OPTS).ok).toBe(true);
    expect(rateLimit(key, OPTS).ok).toBe(true);
  });

  it("blocks the request that exceeds the limit", () => {
    rateLimit(key, OPTS);
    rateLimit(key, OPTS);
    rateLimit(key, OPTS);
    const fourth = rateLimit(key, OPTS);
    expect(fourth.ok).toBe(false);
    expect(fourth.remaining).toBe(0);
  });

  it("decrements remaining on each call", () => {
    expect(rateLimit(key, OPTS).remaining).toBe(2);
    expect(rateLimit(key, OPTS).remaining).toBe(1);
    expect(rateLimit(key, OPTS).remaining).toBe(0);
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    rateLimit(key, OPTS);
    rateLimit(key, OPTS);
    rateLimit(key, OPTS);
    expect(rateLimit(key, OPTS).ok).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit(key, OPTS).ok).toBe(true);
    vi.useRealTimers();
  });
});

describe("clientIp", () => {
  it("reads the first x-forwarded-for entry", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" });
    expect(clientIp(h)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip", () => {
    const h = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(clientIp(h)).toBe("198.51.100.7");
  });

  it("returns 'unknown' when no ip headers present", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
