import { useState, useEffect } from "react";

const NAV = [
  {
    group: "MONITOR",
    items: [
      { id: "overview", label: "Overview",   sub: "Threat landscape",  icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/></svg> },
      { id: "alerts",   label: "Alerts",     sub: "Active threats",    icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2L2.5 16h15L10 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M10 8v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="10" cy="14" r="1" fill="currentColor"/></svg> },
      { id: "logs",     label: "Log Stream", sub: "Event ingestion",   icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h9M3 15h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> },
    ],
  },
  {
    group: "INTELLIGENCE",
    items: [
      { id: "analysis", label: "AI Analysis", sub: "Query & correlate", icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6"/><path d="M7 11c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="10" cy="13.5" r="1" fill="currentColor"/></svg> },
    ],
  },
];

const QUICK = [
  { label: "Inject Test Log", color: "var(--accent-cyan)",   id: "logs" },
  { label: "Run AI Query",    color: "var(--accent-indigo)", id: "analysis" },
];

export default function Sidebar({ active, onNavigate, mobileOpen, onClose }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const pad = n => String(n).padStart(2, "0");
  const clock = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}`;

  return (
    <>
      <style>{`@keyframes pulsebar { 0%,100%{opacity:.35} 50%{opacity:1} }`}</style>
      {mobileOpen && <div className="sidebar-overlay" onClick={onClose}/>}
      <aside className={`sidebar${mobileOpen ? " open" : ""}`} style={{
        width: "var(--sidebar-width)", minWidth: "var(--sidebar-width)", height: "100vh",
        background: "var(--bg-base)", borderRight: "1px solid var(--border-subtle)",
        display: "flex", flexDirection: "column", position: "sticky", top: 0, overflowY: "auto",
      }}>

        {/* Logo */}
        <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
              background: "linear-gradient(135deg,rgba(99,102,241,0.3),rgba(34,211,238,0.15))",
              border: "1px solid rgba(129,140,248,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 5.5V10c0 4 2.8 7 7 8 4.2-1 7-4 7-8V5.5L10 2Z" stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M7 10l2 2.5L13 8" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2, color: "var(--text-primary)" }}>
                Sentinel<span style={{ color: "var(--accent-indigo)" }}>Ops</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                SOC · AI · v1.0
              </div>
            </div>
          </div>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
            borderRadius: "8px", padding: "8px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", display: "inline-block", background: "var(--severity-low)", boxShadow: "0 0 8px rgba(52,211,153,0.9)" }}/>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--severity-low)", letterSpacing: "0.08em" }}>LIVE</span>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>{clock} UTC</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {NAV.map(group => (
            <div key={group.group}>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em", color: "var(--text-muted)", textTransform: "uppercase", padding: "0 8px", marginBottom: "6px" }}>
                {group.group}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {group.items.map(item => {
                  const on = active === item.id;
                  return (
                    <button key={item.id} onClick={() => { onNavigate(item.id); onClose?.(); }} style={{
                      display: "flex", alignItems: "center", gap: "11px",
                      padding: "10px 10px", borderRadius: "9px", width: "100%", cursor: "pointer",
                      border: on ? "1px solid rgba(129,140,248,0.28)" : "1px solid transparent",
                      background: on ? "rgba(129,140,248,0.12)" : "transparent",
                      color: on ? "var(--accent-indigo)" : "var(--text-secondary)",
                      transition: "all 0.15s", textAlign: "left",
                    }}
                    onMouseEnter={e => { if (!on) { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}}
                    onMouseLeave={e => { if (!on) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}}
                    >
                      <div style={{ width: "3px", height: "32px", borderRadius: "3px", flexShrink: 0, background: on ? "var(--accent-indigo)" : "transparent", transition: "background 0.15s" }}/>
                      <span style={{ opacity: on ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: on ? 600 : 500, lineHeight: 1.2 }}>{item.label}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{item.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Actions */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em", color: "var(--text-muted)", textTransform: "uppercase", padding: "0 8px", marginBottom: "8px" }}>
              QUICK ACTIONS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "0 2px" }}>
              {QUICK.map(a => (
                <button key={a.label} onClick={() => { onNavigate(a.id); onClose?.(); }} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px", borderRadius: "8px", cursor: "pointer", width: "100%",
                  background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)", transition: "all 0.15s", textAlign: "left",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.color = a.color; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  <span style={{ fontSize: "14px", color: a.color, fontWeight: 700, flexShrink: 0 }}>+</span>
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>ENGINE</span>
            <span style={{ fontSize: "11px", color: "var(--severity-low)", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.08em" }}>ONLINE</span>
          </div>
          <div style={{ height: "3px", borderRadius: "3px", background: "var(--bg-elevated)", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ height: "100%", width: "100%", borderRadius: "3px", background: "linear-gradient(90deg, var(--accent-indigo), var(--accent-cyan))", animation: "pulsebar 2.5s ease-in-out infinite" }}/>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>SentinelOps © 2026</div>
        </div>
      </aside>
    </>
  );
}
