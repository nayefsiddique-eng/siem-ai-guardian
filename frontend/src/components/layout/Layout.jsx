import { useState } from "react";
import Sidebar from "./Sidebar";

const PAGE_META = {
  overview: "Threat landscape & operational status",
  alerts:   "Active incidents & triage",
  logs:     "Real-time event stream",
  analysis: "AI-powered threat investigation",
};

export default function Layout({ active, onNavigate, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar active={active} onNavigate={onNavigate} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="main-content">
        <div style={{
          height: "52px", borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-base)", display: "flex", alignItems: "center",
          padding: "0 20px", gap: "12px", flexShrink: 0,
        }}>
          <button className="menu-toggle" onClick={() => setMobileOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>

          <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            {active.charAt(0).toUpperCase() + active.slice(1)}
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {PAGE_META[active]}
          </span>

          <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "5px 12px", borderRadius: "6px",
              background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--severity-low)", boxShadow: "0 0 6px rgba(52,211,153,0.8)", display: "inline-block" }}/>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--severity-low)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>ENGINE LIVE</span>
            </div>
            <div style={{
              padding: "5px 12px", borderRadius: "6px",
              background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)",
              fontSize: "11px", fontWeight: 600, color: "var(--accent-indigo)",
              fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
            }}>
              ✦ AI READY
            </div>
          </div>
        </div>

        <div className="page-body">
          {children}
        </div>
      </div>
    </div>
  );
}
