import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { feedbackSchema, feedbackQuerySchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isAuthenticated } from "@/lib/auth";
import { logger, requestId } from "@/lib/logger";

export const dynamic = "force-dynamic";

// POST /api/feedback — public. Submit a piece of feedback.
export async function POST(req: NextRequest) {
  const rid = requestId();
  const ip = clientIp(req.headers);

  // 1) Rate limit before touching the DB.
  const limit = rateLimit(`feedback:${ip}`);
  if (!limit.ok) {
    logger.warn("Rate limit exceeded", { rid, ip });
    return NextResponse.json(
      { error: "Too many submissions. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  // 2) Parse + validate.
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // 3) Persist.
  try {
    const created = await prisma.feedback.create({
      data: {
        category: parsed.data.category,
        comment: parsed.data.comment,
        email: parsed.data.email,
      },
      select: { id: true, category: true, createdAt: true },
    });
    logger.info("Feedback created", { rid, id: created.id, category: created.category });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    logger.error("Failed to create feedback", { rid, error: String(err) });
    return NextResponse.json({ error: "Could not save feedback. Please try again." }, { status: 500 });
  }
}

// GET /api/feedback — admin only. List with filter, search, pagination.
export async function GET(req: NextRequest) {
  const rid = requestId();

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = feedbackQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { category, search, page, pageSize } = parsed.data;

  const where: Prisma.FeedbackWhereInput = {
    ...(category ? { category } : {}),
    ...(search ? { comment: { contains: search, mode: "insensitive" } } : {}),
  };

  try {
    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    logger.error("Failed to fetch feedback", { rid, error: String(err) });
    return NextResponse.json({ error: "Could not load feedback." }, { status: 500 });
  }
}
