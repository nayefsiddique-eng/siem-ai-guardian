import { useState, useEffect } from "react";

const VIEW_META = {
  overview:  { label: "Overview",     sub: "Threat landscape & operational status" },
  alerts:    { label: "Alerts",       sub: "Active detections & triage queue" },
  logs:      { label: "Log Stream",   sub: "Ingested events & raw telemetry" },
  analysis:  { label: "AI Analysis",  sub: "Freeform incident investigation" },
  playbook:  { label: "Playbook",     sub: "Agentic response orchestration" },
};

export default function Topbar({ activeView }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const meta = VIEW_META[activeView] || VIEW_META.overview;
  const pad = n => String(n).padStart(2, "0");
  const timeStr = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}`;

  return (
    <header style={{
      height: "52px", minHeight: "52px",
      background: "var(--bg-base)",
      borderBottom: "1px solid var(--border-subtle)",
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px", gap: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
          {meta.label}
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {meta.sub}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "7px",
          background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
          borderRadius: "6px", padding: "5px 10px",
        }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="var(--text-muted)" strokeWidth="1.3"/>
            <line x1="8" y1="4" x2="8" y2="8.5" stroke="var(--accent-cyan)" strokeWidth="1.4" strokeLinecap="round"/>
            <line x1="8" y1="8.5" x2="11" y2="10.5" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
            {timeStr}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>UTC</span>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "5px 10px", borderRadius: "6px",
          background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--severity-low)", boxShadow: "0 0 6px rgba(52,211,153,0.8)", display: "inline-block" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--severity-low)", letterSpacing: "0.08em" }}>ENGINE LIVE</span>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "5px 10px", borderRadius: "6px",
          background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.20)",
        }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" stroke="var(--accent-indigo)" strokeWidth="1.3"/>
            <path d="M8 1V3M8 13V15M1 8H3M13 8H15" stroke="var(--accent-indigo)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
          </svg>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-indigo)", letterSpacing: "0.08em" }}>AI READY</span>
        </div>
      </div>
    </header>
  );
}
