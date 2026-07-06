"use client";

import { useState } from "react";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/validation";

type FieldErrors = Partial<Record<"category" | "comment" | "email", string[]>>;

export function FeedbackForm() {
  const [category, setCategory] = useState<Category | "">("");
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function submit() {
    setStatus("submitting");
    setErrors({});
    setFormError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, comment, email }),
      });

      if (res.status === 201) {
        setStatus("done");
        return;
      }

      const body = await res.json().catch(() => ({}));
      if (res.status === 400 && body.details) {
        setErrors(body.details as FieldErrors);
        setStatus("idle");
        return;
      }
      setFormError(body.error ?? "Something went wrong. Please try again.");
      setStatus("error");
    } catch {
      setFormError("We couldn't reach the server. Check your connection and retry.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="card" style={{ padding: "40px 32px", textAlign: "center" }}>
        <div style={{ fontSize: "2rem" }}>✓</div>
        <h2 style={{ fontFamily: "var(--serif)", fontWeight: 500, margin: "12px 0 6px" }}>
          Thank you — it's logged.
        </h2>
        <p style={{ color: "var(--ink-soft)", margin: "0 0 20px" }}>
          Every note reaches the team. We read them all.
        </p>
        <button
          className="btn btn-ghost"
          onClick={() => {
            setCategory("");
            setComment("");
            setEmail("");
            setStatus("idle");
          }}
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "28px 26px" }}>
      <div className="field">
        <label htmlFor="category">What kind of feedback is this?</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`pill pill-${c}`}
              aria-pressed={category === c}
              style={{
                cursor: "pointer",
                border: category === c ? "1px solid currentColor" : "1px solid transparent",
                opacity: category && category !== c ? 0.55 : 1,
              }}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        {errors.category && <span className="field-error">{errors.category[0]}</span>}
      </div>

      <div className="field">
        <label htmlFor="comment">Your comments</label>
        <textarea
          id="comment"
          className="textarea"
          placeholder="Tell us what happened, what you'd like, or what you loved…"
          value={comment}
          maxLength={2000}
          onChange={(e) => setComment(e.target.value)}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {errors.comment ? (
            <span className="field-error">{errors.comment[0]}</span>
          ) : (
            <span />
          )}
          <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
            {comment.length}/2000
          </span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="email">Email (optional — only if you'd like a reply)</label>
        <input
          id="email"
          type="email"
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <span className="field-error">{errors.email[0]}</span>}
      </div>

      {formError && (
        <p className="field-error" style={{ marginBottom: 14 }}>
          {formError}
        </p>
      )}

      <button
        className="btn"
        style={{ width: "100%" }}
        disabled={status === "submitting" || !category || comment.trim().length < 3}
        onClick={submit}
      >
        {status === "submitting" ? "Sending…" : "Send feedback"}
      </button>
    </div>
  );
}
