import { useEffect, useRef } from "react";
import { useSiem } from "../../hooks/useSiem";

function StatCard({ label, value, sub, accent, glow }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: `1px solid var(--border-subtle)`,
      borderRadius: "10px",
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "2px",
        background: accent,
        boxShadow: glow,
        borderRadius: "10px 10px 0 0",
      }} />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "9px",
        letterSpacing: "0.14em",
        color: "var(--text-muted)",
        textTransform: "uppercase",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: "28px",
        fontWeight: 700,
        letterSpacing: "-1px",
        color: "var(--text-primary)",
        lineHeight: 1,
      }}>
        {value ?? "—"}
      </span>
      {sub && (
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function SeverityBar({ label, count, max, color }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        color: "var(--text-muted)",
        width: "56px",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}>
        {label}
      </span>
      <div style={{
        flex: 1,
        height: "4px",
        background: "var(--bg-elevated)",
        borderRadius: "2px",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: "2px",
          boxShadow: `0 0 6px ${color}99`,
          transition: "width 0.6s ease",
        }} />
      </div>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
        color: "var(--text-secondary)",
        width: "24px",
        textAlign: "right",
      }}>
        {count}
      </span>
    </div>
  );
}

function AlertRow({ alert }) {
  const SEV_COLOR = {
    critical: "var(--severity-critical)",
    high:     "var(--severity-high)",
    medium:   "var(--severity-medium)",
    low:      "var(--severity-low)",
  };
  const sev = (alert.severity || "low").toLowerCase();
  const color = SEV_COLOR[sev] || "var(--text-muted)";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "90px 1fr 80px 90px",
      alignItems: "center",
      gap: "12px",
      padding: "10px 16px",
      borderBottom: "1px solid var(--border-subtle)",
      transition: "background 0.12s",
      cursor: "default",
    }}
    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        color,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}>
        <span style={{
          width: "5px", height: "5px", borderRadius: "50%",
          background: color,
          boxShadow: sev === "critical" ? `0 0 6px ${color}` : "none",
          flexShrink: 0,
        }} />
        {sev}
      </span>
      <span style={{ fontSize: "12px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {alert.title || alert.alert_type || "Unknown"}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        color: "var(--text-muted)",
        textAlign: "right",
      }}>
        {alert.status || "open"}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        color: "var(--text-muted)",
        textAlign: "right",
      }}>
        {alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : "—"}
      </span>
    </div>
  );
}

export default function DashboardHome() {
  const { stats, alerts, fetchStats, fetchAlerts } = useSiem();

  useEffect(() => {
    fetchStats();
    fetchAlerts();
  }, []);

  const s = stats || {};
  const recentAlerts = (alerts || []).slice(0, 8);

  const sevCounts = {
    critical: s.critical_alerts ?? 0,
    high:     s.high_alerts     ?? 0,
    medium:   s.medium_alerts   ?? 0,
    low:      s.low_alerts      ?? 0,
  };
  const maxSev = Math.max(...Object.values(sevCounts), 1);

  const typeCounts = s.alert_types || {};
  const typeEntries = Object.entries(typeCounts).slice(0, 6);
  const maxType = Math.max(...typeEntries.map(([, v]) => v), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Stat cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "14px",
      }}>
        <StatCard
          label="Total Alerts"
          value={s.total_alerts ?? 0}
          sub="all time"
          accent="var(--accent-indigo)"
          glow="0 0 12px rgba(99,102,241,0.5)"
        />
        <StatCard
          label="Open Alerts"
          value={s.open_alerts ?? 0}
          sub="pending triage"
          accent="var(--severity-high)"
          glow="0 0 12px rgba(251,146,60,0.5)"
        />
        <StatCard
          label="Logs Ingested"
          value={s.total_logs ?? 0}
          sub="indexed events"
          accent="var(--accent-cyan)"
          glow="0 0 12px rgba(34,211,238,0.4)"
        />
        <StatCard
          label="Critical"
          value={s.critical_alerts ?? 0}
          sub="immediate action"
          accent="var(--severity-critical)"
          glow="0 0 12px rgba(244,63,94,0.5)"
        />
      </div>

      {/* Middle row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "14px",
      }}>

        {/* Severity breakdown */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "10px",
          padding: "20px",
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.14em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            marginBottom: "18px",
          }}>
            Severity Distribution
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <SeverityBar label="Critical" count={sevCounts.critical} max={maxSev} color="var(--severity-critical)" />
            <SeverityBar label="High"     count={sevCounts.high}     max={maxSev} color="var(--severity-high)" />
            <SeverityBar label="Medium"   count={sevCounts.medium}   max={maxSev} color="var(--severity-medium)" />
            <SeverityBar label="Low"      count={sevCounts.low}      max={maxSev} color="var(--severity-low)" />
          </div>
        </div>

        {/* Alert types */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "10px",
          padding: "20px",
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.14em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            marginBottom: "18px",
          }}>
            Detection Types
          </div>
          {typeEntries.length === 0 ? (
            <div style={{ fontSize: "12px", color: "var(--text-muted)", paddingTop: "8px" }}>
              No detections yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {typeEntries.map(([type, count]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    width: "130px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.04em",
                  }}>
                    {type.replace(/_/g, " ")}
                  </span>
                  <div style={{
                    flex: 1,
                    height: "4px",
                    background: "var(--bg-elevated)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${(count / maxType) * 100}%`,
                      height: "100%",
                      background: "var(--accent-indigo)",
                      borderRadius: "2px",
                      boxShadow: "0 0 6px rgba(99,102,241,0.5)",
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    width: "20px",
                    textAlign: "right",
                  }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent alerts table */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "10px",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 16px 14px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.14em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
          }}>
            Recent Alerts
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: "var(--text-muted)",
          }}>
            {recentAlerts.length} shown
          </span>
        </div>

        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "90px 1fr 80px 90px",
          gap: "12px",
          padding: "8px 16px",
          background: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          {["Severity", "Type", "Status", "Time"].map(h => (
            <span key={h} style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textAlign: h === "Status" || h === "Time" ? "right" : "left",
            }}>
              {h}
            </span>
          ))}
        </div>

        {recentAlerts.length === 0 ? (
          <div style={{
            padding: "32px 16px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "12px",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            No alerts detected · System monitoring active
          </div>
        ) : (
          recentAlerts.map(a => <AlertRow key={a.id} alert={a} />)
        )}
      </div>
    </div>
  );
}
