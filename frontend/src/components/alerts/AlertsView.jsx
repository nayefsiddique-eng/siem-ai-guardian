import { useEffect, useState } from "react";
import { useSiem } from "../../hooks/useSiem";

const SEV_COLOR = {
  critical: "var(--severity-critical)",
  high:     "var(--severity-high)",
  medium:   "var(--severity-medium)",
  low:      "var(--severity-low)",
};

const STATUS_COLOR = {
  open:            { color: "var(--severity-high)",    bg: "rgba(251,146,60,0.08)",    border: "rgba(251,146,60,0.25)" },
  investigating:   { color: "var(--accent-cyan)",      bg: "rgba(34,211,238,0.08)",    border: "rgba(34,211,238,0.25)" },
  resolved:        { color: "var(--severity-low)",     bg: "rgba(52,211,153,0.08)",    border: "rgba(52,211,153,0.25)" },
  false_positive:  { color: "var(--text-muted)",       bg: "rgba(75,85,99,0.12)",      border: "rgba(75,85,99,0.30)" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLOR[status] || STATUS_COLOR.open;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "4px",
      border: `1px solid ${s.border}`,
      background: s.bg,
      color: s.color,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "9px",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    }}>
      {status?.replace("_", " ") || "open"}
    </span>
  );
}

function AlertCard({ alert, onAnalyze, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const sev = (alert.severity || "low").toLowerCase();
  const color = SEV_COLOR[sev] || "var(--text-muted)";

  const handleAnalyze = async () => {
    setAnalyzing(true);
    await onAnalyze(alert.id);
    setAnalyzing(false);
  };

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)",
      borderLeft: `3px solid ${color}`,
      borderRadius: "8px",
      overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 16px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Severity dot */}
        <span style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: color,
          flexShrink: 0,
          boxShadow: sev === "critical" ? `0 0 8px ${color}` : "none",
        }} />

        {/* Title */}
        <span style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
          {alert.title || alert.alert_type || "Unnamed Alert"}
        </span>

        {/* MITRE tag */}
        {alert.mitre_technique_id && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            color: "var(--accent-indigo)",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.20)",
            borderRadius: "4px",
            padding: "2px 7px",
            letterSpacing: "0.08em",
          }}>
            {alert.mitre_technique_id}
          </span>
        )}

        <StatusBadge status={alert.status} />

        <svg
          width="12" height="12" viewBox="0 0 16 16" fill="none"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            color: "var(--text-muted)",
            flexShrink: 0,
          }}
        >
          <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}>

          {/* Meta grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
          }}>
            {[
              ["Source IP",  alert.source_ip  || "—"],
              ["Dest IP",    alert.dest_ip    || "—"],
              ["Tactic",     alert.mitre_tactic || "—"],
              ["Risk Level", alert.risk_level || "—"],
              ["Confidence", alert.confidence != null ? `${alert.confidence}%` : "—"],
              ["Attack Stage", alert.attack_stage || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "3px",
                }}>
                  {k}
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                }}>
                  {v}
                </div>
              </div>
            ))}
          </div>

          {/* AI summary */}
          {alert.threat_summary && (
            <div style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              padding: "12px 14px",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                color: "var(--accent-indigo)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}>
                AI Threat Summary
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {alert.threat_summary}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {alert.recommendations && (
            <div style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              padding: "12px 14px",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                color: "var(--accent-cyan)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}>
                Recommendations
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {alert.recommendations}
              </p>
            </div>
          )}

          {/* Action row */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              style={{
                padding: "7px 14px",
                borderRadius: "6px",
                border: "1px solid rgba(99,102,241,0.35)",
                background: analyzing ? "var(--bg-elevated)" : "rgba(99,102,241,0.10)",
                color: "var(--accent-indigo)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                letterSpacing: "0.08em",
                cursor: analyzing ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {analyzing ? "ANALYZING…" : "⚡ RUN AI ANALYSIS"}
            </button>

            {["investigating", "resolved", "false_positive"].map(st => (
              <button
                key={st}
                onClick={() => onStatusChange(alert.id, st)}
                style={{
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-default)",
                  background: "transparent",
                  color: "var(--text-muted)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textTransform: "uppercase",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--border-strong)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                → {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlertsView() {
  const { alerts, fetchAlerts, analyzeAlert, updateAlertStatus } = useSiem();
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetchAlerts(); }, []);

  const filtered = (alerts || []).filter(a =>
    filter === "all" ? true : a.status === filter
  );

  const FILTERS = ["all", "open", "investigating", "resolved", "false_positive"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Filter bar */}
      <div style={{
        display: "flex",
        gap: "6px",
        alignItems: "center",
        padding: "14px 16px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "8px",
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          color: "var(--text-muted)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginRight: "6px",
        }}>
          Filter
        </span>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "5px 12px",
              borderRadius: "5px",
              border: `1px solid ${filter === f ? "rgba(99,102,241,0.4)" : "var(--border-subtle)"}`,
              background: filter === f ? "rgba(99,102,241,0.10)" : "transparent",
              color: filter === f ? "var(--accent-indigo)" : "var(--text-muted)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {f.replace("_", " ")}
          </button>
        ))}
        <span style={{
          marginLeft: "auto",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10px",
          color: "var(--text-muted)",
        }}>
          {filtered.length} alert{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Alert cards */}
      {filtered.length === 0 ? (
        <div style={{
          padding: "48px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "8px",
        }}>
          No alerts in this category
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(a => (
            <AlertCard
              key={a.id}
              alert={a}
              onAnalyze={analyzeAlert}
              onStatusChange={updateAlertStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

