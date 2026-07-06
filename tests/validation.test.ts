import { describe, it, expect } from "vitest";
import { feedbackSchema, feedbackQuerySchema } from "@/lib/validation";

describe("feedbackSchema", () => {
  it("accepts a valid submission", () => {
    const r = feedbackSchema.safeParse({
      category: "BUG",
      comment: "The button doesn't work on mobile.",
      email: "a@b.com",
    });
    expect(r.success).toBe(true);
  });

  it("accepts submission without email", () => {
    const r = feedbackSchema.safeParse({ category: "PRAISE", comment: "Great job!" });
    expect(r.success).toBe(true);
  });

  it("treats empty-string email as undefined", () => {
    const r = feedbackSchema.safeParse({ category: "OTHER", comment: "hello", email: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBeUndefined();
  });

  it("rejects an unknown category", () => {
    const r = feedbackSchema.safeParse({ category: "SPAM", comment: "hello there" });
    expect(r.success).toBe(false);
  });

  it("rejects a too-short comment", () => {
    const r = feedbackSchema.safeParse({ category: "BUG", comment: "hi" });
    expect(r.success).toBe(false);
  });

  it("rejects an over-long comment", () => {
    const r = feedbackSchema.safeParse({ category: "BUG", comment: "x".repeat(2001) });
    expect(r.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    const r = feedbackSchema.safeParse({ category: "BUG", comment: "valid comment", email: "nope" });
    expect(r.success).toBe(false);
  });

  it("trims surrounding whitespace on comment", () => {
    const r = feedbackSchema.safeParse({ category: "BUG", comment: "   padded comment   " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.comment).toBe("padded comment");
  });
});

describe("feedbackQuerySchema", () => {
  it("applies default pagination", () => {
    const r = feedbackQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.page).toBe(1);
      expect(r.data.pageSize).toBe(20);
    }
  });

  it("coerces numeric strings from query params", () => {
    const r = feedbackQuerySchema.safeParse({ page: "3", pageSize: "50" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.page).toBe(3);
  });

  it("caps pageSize at 100", () => {
    const r = feedbackQuerySchema.safeParse({ pageSize: "500" });
    expect(r.success).toBe(false);
  });
});
