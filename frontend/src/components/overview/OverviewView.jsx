import { useEffect, useState } from "react";
import { useSiem } from "../../hooks/useSiem";

const SEV = [
  { key: "critical", label: "CRITICAL", color: "var(--severity-critical)" },
  { key: "high",     label: "HIGH",     color: "var(--severity-high)" },
  { key: "medium",   label: "MEDIUM",   color: "var(--severity-medium)" },
  { key: "low",      label: "LOW",      color: "var(--severity-low)" },
];

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

function ThreatTimeline({ alerts }) {
  const now = Date.now();
  const buckets = Array.from({ length: 12 }, (_, i) => {
    const start = now - (12 - i) * 5 * 60 * 1000;
    const end   = start + 5 * 60 * 1000;
    const label = new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const items = alerts.filter(a => {
      const t = new Date(a.created_at).getTime();
      return t >= start && t < end;
    });
    const critical = items.filter(a => a.severity === "critical").length;
    const high     = items.filter(a => a.severity === "high").length;
    const medium   = items.filter(a => a.severity === "medium").length;
    const low      = items.filter(a => a.severity === "low").length;
    return { label, critical, high, medium, low, total: items.length };
  });

  const maxTotal = Math.max(...buckets.map(b => b.total), 1);

  return (
    <div style={{
      background: "var(--bg-surface)", borderRadius: "12px",
      border: "1px solid var(--border-subtle)", padding: "20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "var(--text-muted)" }}>
          THREAT TIMELINE · LAST 60 MIN
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { label: "Critical", color: "var(--severity-critical)" },
            { label: "High",     color: "var(--severity-high)" },
            { label: "Medium",   color: "var(--severity-medium)" },
            { label: "Low",      color: "var(--severity-low)" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: l.color, display: "inline-block" }}/>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
        {buckets.map((b, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", height: "100%" }}>
            <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "1px" }}>
              {b.total === 0 ? (
                <div style={{ width: "100%", height: "2px", background: "var(--bg-elevated)", borderRadius: "2px" }}/>
              ) : (
                <>
                  {b.critical > 0 && <div style={{ width: "100%", height: `${(b.critical / maxTotal) * 64}px`, background: "var(--severity-critical)", borderRadius: "2px", minHeight: "3px", boxShadow: "0 0 4px rgba(248,113,113,0.5)" }}/>}
                  {b.high     > 0 && <div style={{ width: "100%", height: `${(b.high     / maxTotal) * 64}px`, background: "var(--severity-high)",     borderRadius: "2px", minHeight: "3px" }}/>}
                  {b.medium   > 0 && <div style={{ width: "100%", height: `${(b.medium   / maxTotal) * 64}px`, background: "var(--severity-medium)",   borderRadius: "2px", minHeight: "3px" }}/>}
                  {b.low      > 0 && <div style={{ width: "100%", height: `${(b.low      / maxTotal) * 64}px`, background: "var(--severity-low)",      borderRadius: "2px", minHeight: "3px" }}/>}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
        {buckets.map((b, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            {i % 3 === 0 && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                {b.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TopSourceIPs({ alerts }) {
  const ipMap = {};
  alerts.forEach(a => {
    if (!a.source_ip) return;
    if (!ipMap[a.source_ip]) ipMap[a.source_ip] = { total: 0, critical: 0, high: 0 };
    ipMap[a.source_ip].total++;
    if (a.severity === "critical") ipMap[a.source_ip].critical++;
    if (a.severity === "high")     ipMap[a.source_ip].high++;
  });

  const sorted = Object.entries(ipMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8);

  const maxCount = sorted[0]?.[1].total || 1;

  return (
    <div style={{
      background: "var(--bg-surface)", borderRadius: "12px",
      border: "1px solid var(--border-subtle)", padding: "20px",
    }}>
      <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "var(--text-muted)", marginBottom: "18px" }}>
        TOP SOURCE IPs
      </div>

      {sorted.length === 0 ? (
        <div style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "24px 0", fontFamily: "var(--font-mono)" }}>
          No alert sources yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {sorted.map(([ip, data], i) => (
            <div key={ip} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "9px",
                color: "var(--text-muted)", width: "16px", textAlign: "right", flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "11px",
                color: data.critical > 0 ? "var(--severity-critical)" : data.high > 0 ? "var(--severity-high)" : "var(--text-secondary)",
                width: "120px", flexShrink: 0,
                letterSpacing: "0.04em",
              }}>
                {ip}
              </span>
              <div style={{ flex: 1, height: "4px", background: "var(--bg-elevated)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(data.total / maxCount) * 100}%`,
                  background: data.critical > 0 ? "var(--severity-critical)" : data.high > 0 ? "var(--severity-high)" : "var(--accent-indigo)",
                  borderRadius: "2px",
                  transition: "width 0.6s ease",
                  boxShadow: data.critical > 0 ? "0 0 6px rgba(248,113,113,0.4)" : "none",
                }}/>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", width: "20px", textAlign: "right", flexShrink: 0 }}>
                {data.total}
              </span>
              {data.critical > 0 && (
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "9px",
                  color: "var(--severity-critical)", letterSpacing: "0.06em",
                  padding: "1px 5px", borderRadius: "3px",
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  flexShrink: 0,
                }}>
                  CRIT
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OverviewView() {
  const { stats, alerts, fetchStats, fetchAlerts } = useSiem();

  useEffect(() => { fetchStats(); fetchAlerts(); }, []);

  const dist = { critical: 0, high: 0, medium: 0, low: 0 };
  alerts.forEach(a => { if (dist[a.severity] !== undefined) dist[a.severity]++; });
  const maxDist = Math.max(...Object.values(dist), 1);

  const detectionTypes = [...new Set(alerts.map(a => a.alert_type).filter(Boolean))];
  const recentAlerts   = [...alerts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);

  const SEV_COLOR = {
    critical: "var(--severity-critical)",
    high:     "var(--severity-high)",
    medium:   "var(--severity-medium)",
    low:      "var(--severity-low)",
  };

  const DETECT_PLACEHOLDER = ["Brute Force", "Port Scan", "Anomaly", "Data Exfil", "Lateral Move"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <StatCard label="TOTAL ALERTS"  value={stats?.total_alerts  ?? alerts.length}                              sub="all time"         accent="var(--accent-indigo)" />
        <StatCard label="OPEN ALERTS"   value={stats?.open_alerts   ?? alerts.filter(a => a.status === "open").length} sub="pending triage"   accent="var(--severity-high)" />
        <StatCard label="LOGS INGESTED" value={stats?.total_logs    ?? 0}                                          sub="indexed events"   accent="var(--accent-cyan)" />
        <StatCard label="CRITICAL"      value={dist.critical}                                                      sub="immediate action" accent="var(--severity-critical)" />
      </div>

      {/* Severity + Detection types */}
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
              }}>{t.replace(/_/g, " ")}</span>
            ))}
          </div>
          {!detectionTypes.length && (
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "12px" }}>No detections yet</div>
          )}
        </div>
      </div>

      {/* Threat Timeline */}
      <ThreatTimeline alerts={alerts} />

      {/* Top IPs + Recent Alerts */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 280px" }}>
          <TopSourceIPs alerts={alerts} />
        </div>

        <div style={{ flex: "2 1 400px", background: "var(--bg-surface)", borderRadius: "12px", border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "var(--text-muted)" }}>RECENT ALERTS</span>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{recentAlerts.length} shown</span>
          </div>

          {recentAlerts.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 12px", display: "block", opacity: 0.25 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" stroke="var(--accent-indigo)" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                No alerts detected · System monitoring active
              </div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["SEVERITY", "TYPE", "STATUS", "TIME"].map(h => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.12em", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((a, i) => (
                  <tr key={a.id} style={{ borderBottom: i < recentAlerts.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "11px 20px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", color: SEV_COLOR[a.severity] || "var(--text-muted)", fontWeight: 600 }}>
                        {(a.severity || "—").toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "11px 20px", fontSize: "12px", color: "var(--text-secondary)" }}>
                      {(a.alert_type || a.title || "—").replace(/_/g, " ")}
                    </td>
                    <td style={{ padding: "11px 20px" }}>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em",
                        padding: "3px 8px", borderRadius: "4px",
                        background: a.status === "open" ? "rgba(251,146,60,0.1)" : "rgba(52,211,153,0.08)",
                        border: `1px solid ${a.status === "open" ? "rgba(251,146,60,0.25)" : "rgba(52,211,153,0.2)"}`,
                        color: a.status === "open" ? "var(--severity-high)" : "var(--severity-low)",
                      }}>
                        {(a.status || "unknown").toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "11px 20px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                      {a.created_at ? new Date(a.created_at).toLocaleTimeString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
