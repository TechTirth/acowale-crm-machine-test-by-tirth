import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Lightweight, dependency-free admin auth.
//
// The dashboard is a single-tenant internal console, so a shared admin
// password gated behind an HMAC-signed, httpOnly cookie is proportionate.
// A multi-user product would swap this for NextAuth/Clerk + real user rows —
// see DECISIONS.md. The signing keeps the cookie tamper-proof so no session
// store is needed.

const COOKIE = "acowale_admin";
const MAX_AGE_S = 60 * 60 * 8; // 8h working session

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short.");
  }
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// Verifies the admin password from the login form.
export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not configured.");
  return safeEqual(password, expected);
}

export async function createSession(): Promise<void> {
  const issuedAt = String(Date.now());
  const token = `${issuedAt}.${sign(issuedAt)}`;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return false;
  const [issuedAt, sig] = token.split(".");
  if (!issuedAt || !sig) return false;
  if (!safeEqual(sig, sign(issuedAt))) return false;
  // Expiry check (cookie maxAge already enforces this, but double-guard).
  return Date.now() - Number(issuedAt) < MAX_AGE_S * 1000;
}
