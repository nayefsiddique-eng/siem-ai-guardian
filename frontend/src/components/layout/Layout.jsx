import { useState } from "react";
import Sidebar from "./Sidebar";

const PAGE_TITLES = {
  overview: "Overview",
  alerts: "Alerts",
  logs: "Log Stream",
  analysis: "AI Analysis",
  sentinalai: "Sentinal AI",
  playbook: "Playbooks",
  reports: "Reports",
  compliance: "Compliance",
};

const PAGE_META = {
  overview: "Threat landscape & operational status",
  alerts: "Active incidents & triage",
  logs: "Real-time event stream",
  analysis: "AI-powered threat investigation",
  sentinalai: "AI SOC assistant",
  playbook: "Response automation",
  reports: "Executive reporting",
  compliance: "Framework monitoring",
};

export default function Layout({ active, onNavigate, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="main-content">
        <div style={{
          height: "52px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: "12px"
        }}>
          <span style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--text-primary)"
          }}>
            {PAGE_TITLES[active]}
          </span>

          <span style={{
            fontSize: "12px",
            color: "var(--text-muted)"
          }}>
            {PAGE_META[active]}
          </span>

          <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.25)"
            }}>
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#34d399",
                boxShadow: "0 0 8px #34d399"
              }} />
              <span style={{
                color: "#34d399",
                fontSize: "11px",
                fontFamily: "var(--font-mono)"
              }}>
                ENGINE LIVE
              </span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.25)"
            }}>
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#818cf8",
                boxShadow: "0 0 8px #818cf8"
              }} />
              <span style={{
                color: "#818cf8",
                fontSize: "11px",
                fontFamily: "var(--font-mono)"
              }}>
                AI READY
              </span>
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
