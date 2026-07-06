"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Login failed.");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div className="card" style={{ padding: "32px 28px", width: "100%", maxWidth: 380 }}>
        <p className="mono" style={{ fontSize: "0.75rem", letterSpacing: "0.1em", color: "var(--ink-faint)", margin: 0 }}>
          TEAM CONSOLE
        </p>
        <h1 style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: "1.6rem", margin: "8px 0 20px" }}>
          Sign in
        </h1>
        <div className="field">
          <label htmlFor="password">Admin password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
        </div>
        {error && <p className="field-error" style={{ marginBottom: 12 }}>{error}</p>}
        <button className="btn" style={{ width: "100%" }} onClick={submit} disabled={loading || !password}>
          {loading ? "Checking…" : "Enter dashboard"}
        </button>
      </div>
    </main>
  );
}
