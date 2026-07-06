import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkPassword, createSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const schema = z.object({ password: z.string().min(1) });

// POST /api/auth/login — exchange the admin password for a session cookie.
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  // Tighter limit on auth to blunt brute-force attempts.
  const limit = rateLimit(`login:${ip}`);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  if (!checkPassword(parsed.data.password)) {
    logger.warn("Failed admin login", { ip });
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  await createSession();
  logger.info("Admin logged in", { ip });
  return NextResponse.json({ ok: true });
}
