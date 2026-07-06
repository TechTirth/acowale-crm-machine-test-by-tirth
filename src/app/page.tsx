import Link from "next/link";
import { FeedbackForm } from "@/components/FeedbackForm";

export default function Home() {
  return (
    <main>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          background: "var(--paper-raised)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
          }}
        >
          <span className="mono" style={{ fontWeight: 600, letterSpacing: "0.06em" }}>
            ACOWALE<span style={{ color: "var(--teal)" }}>·</span>FEEDBACK
          </span>
          <Link href="/dashboard" className="mono" style={{ fontSize: "0.82rem", color: "var(--ink-faint)", textDecoration: "none" }}>
            Team console →
          </Link>
        </div>
      </header>

      {/* Hero — the thesis: your words become a signal the team acts on. */}
      <section className="container" style={{ paddingTop: 72, paddingBottom: 28, maxWidth: 720 }}>
        <p
          className="mono"
          style={{ color: "var(--teal)", fontSize: "0.8rem", letterSpacing: "0.14em", margin: 0 }}
        >
          WE'RE LISTENING
        </p>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: "clamp(2.1rem, 5vw, 3.2rem)",
            lineHeight: 1.08,
            margin: "14px 0 12px",
            letterSpacing: "-0.02em",
          }}
        >
          Tell us what's working —<br />and what isn't.
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "1.05rem", lineHeight: 1.6, margin: 0 }}>
          A bug, an idea, a rough edge, or just a kind word. It takes thirty seconds
          and lands directly with the people building the product.
        </p>
      </section>

      <section className="container" style={{ paddingBottom: 80, maxWidth: 720 }}>
        <FeedbackForm />
      </section>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "24px 0" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <span className="mono" style={{ fontSize: "0.74rem", color: "var(--ink-faint)" }}>
            Acowale CRM Machine Test · v1
          </span>
        </div>
      </footer>
    </main>
  );
}
