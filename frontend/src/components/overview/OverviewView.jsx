import { useEffect } from "react";
import { useSiem } from "../../hooks/useSiem";

const SEV = [
  { key: "critical", label: "CRITICAL", color: "var(--severity-critical)" },
  { key: "high",     label: "HIGH",     color: "var(--severity-high)" },
  { key: "medium",   label: "MEDIUM",   color: "var(--severity-medium)" },
  { key: "low",      label: "LOW",      color: "var(--severity-low)" },
];

const DETECT_PLACEHOLDER = ["Brute Force", "Port Scan", "Anomaly", "Data Exfil", "Lateral Move"];

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "var(--bg-surface)", borderRadius: "12px",
      border: "1px solid var(--border-subtle)", padding: "20px",
      flex: 1, minWidth: 0, borderTop: `2px solid ${accent}`,
    }}>
      <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "var(--text-muted)", marginBottom: "10px" }}>{label}</div>
      <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, fontFamily: "var(--font-mono)" }}>{value ?? "—"}</div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>{sub}</div>
    </div>
  );
}

function SeverityBar({ label, color, value, max }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color, letterSpacing: "0.1em", width: "60px", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: "4px", borderRadius: "4px", background: "var(--bg-elevated)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: "4px", background: color, transition: "width 0.6s ease", opacity: value === 0 ? 0.25 : 1 }}/>
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: value > 0 ? color : "var(--text-muted)", width: "24px", textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function OverviewView() {
  const { stats, alerts, fetchStats, fetchAlerts } = useSiem();
  useEffect(() => { fetchStats(); fetchAlerts(); }, []);

  const dist = { critical: 0, high: 0, medium: 0, low: 0 };
  alerts.forEach(a => { if (dist[a.severity] !== undefined) dist[a.severity]++; });
  const maxDist = Math.max(...Object.values(dist), 1);

  const detectionTypes = [...new Set(alerts.map(a => a.type).filter(Boolean))];
  const recentAlerts = [...alerts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);
  const SEV_COLOR = { critical: "var(--severity-critical)", high: "var(--severity-high)", medium: "var(--severity-medium)", low: "var(--severity-low)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <StatCard label="TOTAL ALERTS"  value={stats?.total_alerts ?? alerts.length}                        sub="all time"         accent="var(--accent-indigo)" />
        <StatCard label="OPEN ALERTS"   value={stats?.open_alerts  ?? alerts.filter(a=>a.status==="open").length} sub="pending triage"   accent="var(--severity-high)" />
        <StatCard label="LOGS INGESTED" value={stats?.logs_ingested ?? 0}                                   sub="indexed events"   accent="var(--accent-cyan)" />
        <StatCard label="CRITICAL"      value={dist.critical}                                               sub="immediate action" accent="var(--severity-critical)" />
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: "2 1 340px", background: "var(--bg-surface)", borderRadius: "12px", border: "1px solid var(--border-subtle)", padding: "20px" }}>
          <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "var(--text-muted)", marginBottom: "16px" }}>SEVERITY DISTRIBUTION</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {SEV.map(s => <SeverityBar key={s.key} label={s.label} color={s.color} value={dist[s.key]} max={maxDist} />)}
          </div>
        </div>

        <div style={{ flex: "1 1 220px", background: "var(--bg-surface)", borderRadius: "12px", border: "1px solid var(--border-subtle)", padding: "20px" }}>
          <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "var(--text-muted)", marginBottom: "16px" }}>DETECTION TYPES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {(detectionTypes.length ? detectionTypes : DETECT_PLACEHOLDER).map(t => (
              <span key={t} style={{
                fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.06em",
                padding: "4px 10px", borderRadius: "5px",
                background: detectionTypes.length ? "rgba(129,140,248,0.1)" : "var(--bg-elevated)",
                border: `1px solid ${detectionTypes.length ? "rgba(129,140,248,0.25)" : "var(--border-subtle)"}`,
                color: detectionTypes.length ? "var(--accent-indigo)" : "var(--text-muted)",
                opacity: detectionTypes.length ? 1 : 0.45,
              }}>{t}</span>
            ))}
          </div>
          {!detectionTypes.length && (
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "12px" }}>No detections yet · monitoring active</div>
          )}
        </div>
      </div>

      <div style={{ background: "var(--bg-surface)", borderRadius: "12px", border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "var(--text-muted)" }}>RECENT ALERTS</span>
          <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{recentAlerts.length} shown</span>
        </div>

        {recentAlerts.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 12px", display: "block", opacity: 0.25 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" stroke="var(--accent-indigo)" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>No alerts detected · System monitoring active</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["SEVERITY","TYPE","STATUS","TIME"].map(h => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.12em", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentAlerts.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < recentAlerts.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", color: SEV_COLOR[a.severity] || "var(--text-muted)", fontWeight: 600 }}>
                      {(a.severity || "—").toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: "12px", color: "var(--text-secondary)" }}>{a.type || "—"}</td>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em",
                      padding: "3px 8px", borderRadius: "4px",
                      background: a.status === "open" ? "rgba(251,146,60,0.1)" : "rgba(52,211,153,0.08)",
                      border: `1px solid ${a.status === "open" ? "rgba(251,146,60,0.25)" : "rgba(52,211,153,0.2)"}`,
                      color: a.status === "open" ? "var(--severity-high)" : "var(--severity-low)",
                    }}>{(a.status || "unknown").toUpperCase()}</span>
                  </td>
                  <td style={{ padding: "12px 20px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                    {a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
