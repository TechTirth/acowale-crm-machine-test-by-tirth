import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { CATEGORIES } from "@/lib/validation";
import { logger, requestId } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET /api/analytics — admin only. Summary for the dashboard cards/chart.
export async function GET() {
  const rid = requestId();

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, grouped, last7Days] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.groupBy({ by: ["category"], _count: { _all: true } }),
      prisma.feedback.count({ where: { createdAt: { gte: since } } }),
    ]);

    // Normalise: ensure every category appears, even with a zero count.
    const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<string, number>;
    for (const g of grouped) counts[g.category] = g._count._all;

    const byCategory = CATEGORIES.map((category) => ({
      category,
      count: counts[category],
      percentage: total === 0 ? 0 : Math.round((counts[category] / total) * 1000) / 10,
    }));

    return NextResponse.json({
      data: { total, last7Days, byCategory },
    });
  } catch (err) {
    logger.error("Failed to compute analytics", { rid, error: String(err) });
    return NextResponse.json({ error: "Could not load analytics." }, { status: 500 });
  }
}
