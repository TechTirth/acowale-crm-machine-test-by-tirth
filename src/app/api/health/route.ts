import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Liveness + readiness in one. Returns 200 only if the DB answers a trivial
// query, so a load balancer / uptime monitor can detect a broken DB link.
export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "up",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Health check failed", { error: String(err) });
    return NextResponse.json(
      { status: "degraded", db: "down", timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
