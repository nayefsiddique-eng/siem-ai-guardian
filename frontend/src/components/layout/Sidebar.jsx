import { useState, useEffect } from "react";

const NAV = [
  {
    group: "MONITOR",
    items: [
      {
        id: "overview", label: "Overview", sub: "Threat landscape",
        icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/></svg>,
      },
      {
        id: "alerts", label: "Alerts", sub: "Active threats",
        icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2L2.5 16h15L10 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M10 8v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="10" cy="14" r="1" fill="currentColor"/></svg>,
      },
      {
        id: "logs", label: "Log Stream", sub: "Event ingestion",
        icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h9M3 15h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
      },
    ],
  },
  {
    group: "INTELLIGENCE",
    items: [
      {
        id: "analysis", label: "AI Analysis", sub: "Query & correlate",
        icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6"/><path d="M7 11c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="10" cy="13.5" r="1" fill="currentColor"/></svg>,
      },
{
  id: "SentinelOps",
  label: "Sentinal-Ops",
  sub: "AI SOC assistant",
  icon: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2L16 5V9C16 13 13.5 16.2 10 18C6.5 16.2 4 13 4 9V5L10 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    </svg>
  ),
},
      {
        id: "playbook", label: "Playbooks", sub: "Response automation",
        icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 3h10a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1Z" stroke="currentColor" strokeWidth="1.6"/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
      },
      {
        id: "reports", label: "Reports", sub: "Export & summaries",
        icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 3h8l4 4v10H4V3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M12 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
      },
    ],
  },
];

export default function Sidebar({ active, onNavigate, mobileOpen, onClose }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = n => String(n).padStart(2, "0");
  const clock = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}`;

  return (
    <>
      <style>{`
        @keyframes pulsebar { 0%,100%{opacity:.4} 50%{opacity:1} }
        .nav-btn { transition: all 0.15s ease; }
        .nav-btn:hover .nav-label { color: #f0f2f7 !important; }
        .nav-btn:hover .nav-sub   { color: #a8b3cc !important; }
      `}</style>

      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            display: "none",
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)", zIndex: 40,
          }}
          className="sidebar-overlay"
        />
      )}

      <aside
        className={`sidebar${mobileOpen ? " open" : ""}`}
        style={{
          width: "var(--sidebar-width)",
          minWidth: "var(--sidebar-width)",
          height: "100vh",
          background: "#0d0f14",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          overflowY: "auto",
          flexShrink: 0,
        }}
      >

        {/* -- Logo -- */}
        <div style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
              background: "linear-gradient(135deg, rgba(129,140,248,0.25), rgba(34,211,238,0.12))",
              border: "1px solid rgba(129,140,248,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 5.5V10c0 4 2.8 7 7 8 4.2-1 7-4 7-8V5.5L10 2Z"
                  stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M7 10l2 2.5L13 8"
                  stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{
                fontSize: "15px", fontWeight: 700,
                letterSpacing: "-0.01em", lineHeight: 1.2,
                color: "#f0f2f7",
              }}>
                Sentinel<span style={{ color: "#818cf8" }}>-Ops</span>
              </div>
              <div style={{
                fontSize: "10px", color: "#5a6480", marginTop: "2px",
                fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
              }}>
                SOC AI v1.0
              </div>
            </div>
          </div>

          {/* Live status chip */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(52,211,153,0.08)",
            border: "1px solid rgba(52,211,153,0.22)",
            borderRadius: "8px", padding: "8px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{
                width: "7px", height: "7px", borderRadius: "50%",
                display: "inline-block",
                background: "#34d399",
                boxShadow: "0 0 8px rgba(52,211,153,0.9)",
              }}/>
              <span style={{
                fontSize: "11px", fontWeight: 600,
                color: "#34d399", letterSpacing: "0.08em",
                fontFamily: "var(--font-mono)",
              }}>
                LIVE
              </span>
            </div>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "11px", color: "#a8b3cc",
            }}>
              {clock} UTC
            </span>
          </div>
        </div>

        {/* -- Nav -- */}
        <nav style={{
          flex: 1, padding: "16px 10px",
          display: "flex", flexDirection: "column", gap: "24px",
        }}>
          {NAV.map(group => (
            <div key={group.group}>
              <div style={{
                fontSize: "10px", fontWeight: 600,
                letterSpacing: "0.16em", color: "#3d4660",
                textTransform: "uppercase",
                padding: "0 10px", marginBottom: "6px",
              }}>
                {group.group}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {group.items.map(item => {
                  const on = active === item.id;
                  return (
                    <button
                      key={item.id}
                      className="nav-btn"
                      onClick={() => { onNavigate(item.id); if (onClose) { onClose(); }; }}
                      style={{
                        display: "flex", alignItems: "center", gap: "11px",
                        padding: "10px 10px", borderRadius: "9px",
                        width: "100%", cursor: "pointer", textAlign: "left",
                        border: on
                          ? "1px solid rgba(129,140,248,0.35)"
                          : "1px solid transparent",
                        background: on
                          ? "rgba(129,140,248,0.14)"
                          : "transparent",
                        color: on ? "#818cf8" : "#a8b3cc",
                      }}
                    >
                      {/* Active bar */}
                      <div style={{
                        width: "3px", height: "32px", borderRadius: "3px",
                        flexShrink: 0,
                        background: on ? "#818cf8" : "transparent",
                        boxShadow: on ? "0 0 8px rgba(129,140,248,0.7)" : "none",
                        transition: "all 0.15s",
                      }}/>

                      {/* Icon */}
                      <span style={{
                        color: on ? "#818cf8" : "#5a6480",
                        flexShrink: 0,
                        transition: "color 0.15s",
                      }}>
                        {item.icon}
                      </span>

                      {/* Labels */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="nav-label"
                          style={{
                            fontSize: "13px",
                            fontWeight: on ? 600 : 500,
                            lineHeight: 1.2,
                            color: on ? "#f0f2f7" : "#a8b3cc",
                            transition: "color 0.15s",
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          className="nav-sub"
                          style={{
                            fontSize: "11px",
                            color: on ? "#6b7a99" : "#3d4660",
                            marginTop: "2px",
                            transition: "color 0.15s",
                          }}
                        >
                          {item.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* -- Footer -- */}
        <div style={{
          padding: "14px 16px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: "8px",
          }}>
            <span style={{
              fontSize: "11px", color: "#3d4660",
              fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
            }}>
              ENGINE
            </span>
            <span style={{
              fontSize: "11px", color: "#34d399",
              fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.08em",
            }}>
              ONLINE
            </span>
          </div>

          <div style={{
            height: "3px", borderRadius: "3px",
            background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: "10px",
          }}>
            <div style={{
              height: "100%", width: "100%", borderRadius: "3px",
              background: "linear-gradient(90deg, #818cf8, #22d3ee)",
              animation: "pulsebar 2.5s ease-in-out infinite",
            }}/>
          </div>

          <div style={{
            fontSize: "11px", color: "#3d4660",
            fontFamily: "var(--font-mono)",
          }}>
            SentinelOps 2026
          </div>
        </div>
      </aside>
    </>
  );
}





















