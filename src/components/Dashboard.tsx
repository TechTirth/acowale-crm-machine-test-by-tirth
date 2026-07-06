"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/validation";
import { CategoryPill } from "@/components/CategoryPill";

type Analytics = {
  total: number;
  last7Days: number;
  byCategory: { category: Category; count: number; percentage: number }[];
};

type FeedbackRow = {
  id: string;
  category: Category;
  comment: string;
  email: string | null;
  createdAt: string;
};

type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

const CATEGORY_COLORS: Record<Category, string> = {
  BUG: "var(--coral)",
  FEATURE: "var(--teal)",
  IMPROVEMENT: "var(--amber)",
  PRAISE: "var(--violet)",
  OTHER: "var(--ink-faint)",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function Dashboard() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [category, setCategory] = useState<Category | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    const res = await fetch("/api/analytics");
    if (res.status === 401) return router.push("/login");
    if (res.ok) setAnalytics((await res.json()).data);
  }, [router]);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search.trim()) params.set("search", search.trim());
    params.set("page", String(page));
    try {
      const res = await fetch(`/api/feedback?${params}`);
      if (res.status === 401) return router.push("/login");
      if (!res.ok) throw new Error();
      const body = await res.json();
      setRows(body.data);
      setPagination(body.pagination);
    } catch {
      setError("Couldn't load feedback. Retry in a moment.");
    } finally {
      setLoading(false);
    }
  }, [category, search, page, router]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Debounce search + reload list when filters change.
  useEffect(() => {
    const t = setTimeout(loadFeedback, 250);
    return () => clearTimeout(t);
  }, [loadFeedback]);

  const maxCount = analytics ? Math.max(1, ...analytics.byCategory.map((c) => c.count)) : 1;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main>
      <header style={{ borderBottom: "1px solid var(--line)", background: "var(--paper-raised)" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <span className="mono" style={{ fontWeight: 600, letterSpacing: "0.06em" }}>
            ACOWALE<span style={{ color: "var(--teal)" }}>·</span>CONSOLE
          </span>
          <button className="btn btn-ghost" style={{ padding: "7px 14px" }} onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <h1 style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: "1.8rem", margin: "0 0 24px" }}>
          Feedback overview
        </h1>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
          <StatCard label="Total feedback" value={analytics?.total ?? "—"} />
          <StatCard label="Last 7 days" value={analytics?.last7Days ?? "—"} accent="var(--teal)" />
          <StatCard
            label="Top category"
            value={
              analytics
                ? CATEGORY_LABELS[[...analytics.byCategory].sort((a, b) => b.count - a.count)[0].category]
                : "—"
            }
          />
        </div>

        {/* Distribution chart */}
        <div className="card" style={{ padding: "22px 24px", marginBottom: 28 }}>
          <p className="mono" style={{ fontSize: "0.72rem", letterSpacing: "0.1em", color: "var(--ink-faint)", margin: "0 0 16px" }}>
            CATEGORY DISTRIBUTION
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {analytics?.byCategory.map((c) => (
              <div key={c.category} style={{ display: "grid", gridTemplateColumns: "120px 1fr 64px", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>{CATEGORY_LABELS[c.category]}</span>
                <div style={{ background: "var(--line)", borderRadius: 6, height: 10, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(c.count / maxCount) * 100}%`,
                      height: "100%",
                      background: CATEGORY_COLORS[c.category],
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <span className="mono" style={{ fontSize: "0.8rem", textAlign: "right", color: "var(--ink-soft)" }}>
                  {c.count} · {c.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <input
            className="input"
            style={{ flex: "1 1 240px", maxWidth: 340 }}
            placeholder="Search comments…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <select
            className="select"
            style={{ width: "auto" }}
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value as Category | "");
            }}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          {(category || search) && (
            <button
              className="btn btn-ghost"
              style={{ padding: "9px 14px" }}
              onClick={() => {
                setCategory("");
                setSearch("");
                setPage(1);
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Recent submissions list */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
            <span className="mono" style={{ fontSize: "0.72rem", letterSpacing: "0.1em", color: "var(--ink-faint)" }}>
              RECENT SUBMISSIONS
            </span>
            {pagination && (
              <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
                {pagination.total} total
              </span>
            )}
          </div>

          {error && <p style={{ padding: 24, color: "var(--coral)" }}>{error}</p>}
          {!error && loading && <p style={{ padding: 24, color: "var(--ink-faint)" }}>Loading…</p>}
          {!error && !loading && rows.length === 0 && (
            <p style={{ padding: 24, color: "var(--ink-faint)" }}>
              No feedback matches these filters yet.
            </p>
          )}

          {!loading &&
            rows.map((r) => (
              <div key={r.id} style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <CategoryPill category={r.category} />
                  <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }} title={new Date(r.createdAt).toLocaleString()}>
                    {timeAgo(r.createdAt)}
                  </span>
                </div>
                <p style={{ margin: 0, lineHeight: 1.5 }}>{r.comment}</p>
                {r.email && (
                  <p className="mono" style={{ margin: "6px 0 0", fontSize: "0.76rem", color: "var(--ink-faint)" }}>
                    {r.email}
                  </p>
                )}
              </div>
            ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20, alignItems: "center" }}>
            <button className="btn btn-ghost" style={{ padding: "8px 14px" }} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </button>
            <span className="mono" style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
              {page} / {pagination.totalPages}
            </span>
            <button
              className="btn btn-ghost"
              style={{ padding: "8px 14px" }}
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      <p className="mono" style={{ fontSize: "0.72rem", letterSpacing: "0.08em", color: "var(--ink-faint)", margin: "0 0 8px" }}>
        {label.toUpperCase()}
      </p>
      <p style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: "2rem", margin: 0, color: accent ?? "var(--ink)" }}>
        {value}
      </p>
    </div>
  );
}
