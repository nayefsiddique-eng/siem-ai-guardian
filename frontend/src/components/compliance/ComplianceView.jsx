import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const FW_COLOR = {
  SOC2:     "#818cf8",
  ISO27001: "#22d3ee",
  GDPR:     "#f87171",
  NIST_CSF: "#fbbf24",
};

const SEV_COLOR = {
  critical: "#f87171",
  high:     "#fb923c",
  medium:   "#fbbf24",
  low:      "#34d399",
};

const STATUS_META = {
  compliant:     { label: "COMPLIANT",     color: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.25)" },
  at_risk:       { label: "AT RISK",       color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)" },
  non_compliant: { label: "NON-COMPLIANT", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)" },
};

const card = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "12px",
  padding: "20px",
};

const monoLabel = {
  fontFamily: "var(--font-mono)",
  fontSize: "9px",
  letterSpacing: "0.14em",
  color: "var(--text-muted)",
  textTransform: "uppercase",
  marginBottom: "14px",
};

function StatusBadge({ status, large }) {
  const m = STATUS_META[status] || STATUS_META.compliant;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: large ? "8px 16px" : "3px 10px",
      borderRadius: "6px",
      background: m.bg, border: `1px solid ${m.border}`,
      color: m.color,
      fontFamily: "var(--font-mono)",
      fontSize: large ? "12px" : "9px",
      fontWeight: 700, letterSpacing: "0.12em",
    }}>
      <span style={{
        width: large ? "8px" : "5px",
        height: large ? "8px" : "5px",
        borderRadius: "50%", background: m.color,
        boxShadow: `0 0 6px ${m.color}`,
        flexShrink: 0,
      }}/>
      {m.label}
    </span>
  );
}

function FrameworkCard({ fw }) {
  const color = FW_COLOR[fw.id] || "#818cf8";
  const sm = STATUS_META[fw.status] || STATUS_META.compliant;
  return (
    <div style={{
      ...card, padding: "18px",
      borderTop: `2px solid ${color}`,
      display: "flex", flexDirection: "column", gap: "12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "3px" }}>
            {fw.name}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{fw.desc}</div>
        </div>
        <StatusBadge status={fw.status} />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
            Impact
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: sm.color, fontWeight: 700 }}>
            {fw.impact_pct}%
          </span>
        </div>
        <div style={{ height: "5px", background: "var(--bg-elevated)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${fw.impact_pct}%`,
            background: color, borderRadius: "3px",
            boxShadow: `0 0 8px ${color}66`,
            transition: "width 0.8s ease",
          }}/>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{
          flex: 1, background: "var(--bg-elevated)", borderRadius: "8px",
          padding: "10px", textAlign: "center",
          border: "1px solid rgba(248,113,113,0.15)",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "#f87171" }}>
            {fw.triggered}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", marginTop: "2px" }}>
            VIOLATED
          </div>
        </div>
        <div style={{
          flex: 1, background: "var(--bg-elevated)", borderRadius: "8px",
          padding: "10px", textAlign: "center",
          border: "1px solid rgba(52,211,153,0.15)",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "#34d399" }}>
            {fw.clean}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", marginTop: "2px" }}>
            CLEAN
          </div>
        </div>
        <div style={{
          flex: 1, background: "var(--bg-elevated)", borderRadius: "8px",
          padding: "10px", textAlign: "center",
          border: "1px solid var(--border-subtle)",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
            {fw.total_controls}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", marginTop: "2px" }}>
            TOTAL
          </div>
        </div>
      </div>

      {fw.triggered_list?.length > 0 && (
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#f87171", letterSpacing: "0.1em", marginBottom: "6px" }}>
            VIOLATED CONTROLS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {fw.triggered_list.map(c => (
              <span key={c} style={{
                fontFamily: "var(--font-mono)", fontSize: "10px",
                padding: "2px 7px", borderRadius: "4px",
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.22)",
                color: "#f87171",
              }}>{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ControlsTab({ data }) {
  const frameworks = Object.values(data.frameworks || {});
  const allControls = {};

  frameworks.forEach(fw => {
    Object.entries(fw.control_details || {}).forEach(([id, desc]) => {
      if (!allControls[id]) allControls[id] = { id, desc, frameworks: {} };
      allControls[id].frameworks[fw.id] = fw.triggered_list?.includes(id) ? "violated" : "clean";
    });
  });

  const rows = Object.values(allControls);
  const fwIds = frameworks.map(f => f.id);

  return (
    <div style={{ background: "var(--bg-surface)", borderRadius: "12px", border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.12em", fontWeight: 500, whiteSpace: "nowrap" }}>
                CONTROL
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.12em", fontWeight: 500 }}>
                DESCRIPTION
              </th>
              {fwIds.map(fw => (
                <th key={fw} style={{
                  padding: "12px 16px", textAlign: "center",
                  fontFamily: "var(--font-mono)", fontSize: "9px",
                  color: FW_COLOR[fw] || "var(--text-muted)",
                  letterSpacing: "0.1em", fontWeight: 600, whiteSpace: "nowrap",
                }}>
                  {fw}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "11px 16px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {row.id}
                </td>
                <td style={{ padding: "11px 16px", fontSize: "11px", color: "var(--text-muted)", maxWidth: 280 }}>
                  {row.desc}
                </td>
                {fwIds.map(fw => {
                  const st = row.frameworks[fw];
                  if (!st) return (
                    <td key={fw} style={{ padding: "11px 16px", textAlign: "center" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                    </td>
                  );
                  return (
                    <td key={fw} style={{ padding: "11px 16px", textAlign: "center" }}>
                      {st === "violated" ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: "20px", height: "20px", borderRadius: "50%",
                          background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)",
                          color: "#f87171", fontSize: "11px", fontWeight: 700,
                        }}>✕</span>
                      ) : (
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: "20px", height: "20px", borderRadius: "50%",
                          background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.25)",
                          color: "#34d399", fontSize: "11px", fontWeight: 700,
                        }}>✓</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttackMappingTab({ data }) {
  const attacks = Object.entries(data.attack_mapping || {});
  if (attacks.length === 0) return (
    <div style={{ ...card, textAlign: "center", padding: "48px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>
      No attack data available. Ingest logs to populate.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {attacks.map(([type, info]) => (
        <div key={type} style={{
          ...card, padding: "16px 18px",
          borderLeft: `3px solid ${SEV_COLOR[info.severity] || "var(--text-muted)"}`,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "3px" }}>
                {type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-indigo)", letterSpacing: "0.06em" }}>
                {info.mitre}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.1em",
                padding: "2px 8px", borderRadius: "4px", fontWeight: 700,
                color: SEV_COLOR[info.severity] || "var(--text-muted)",
                background: `${SEV_COLOR[info.severity]}15`,
                border: `1px solid ${SEV_COLOR[info.severity]}30`,
              }}>
                {(info.severity || "").toUpperCase()}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "10px",
                color: "var(--text-muted)", letterSpacing: "0.06em",
              }}>
                {info.count}x detected
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {(info.frameworks || []).map(fw => (
              <span key={fw} style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.06em",
                padding: "4px 10px", borderRadius: "5px",
                background: `${FW_COLOR[fw] || "#818cf8"}12`,
                border: `1px solid ${FW_COLOR[fw] || "#818cf8"}30`,
                color: FW_COLOR[fw] || "#818cf8",
              }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: FW_COLOR[fw] || "#818cf8", flexShrink: 0 }}/>
                {fw}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ComplianceView() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState("overview");

  const token = localStorage.getItem("siem_token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/compliance/`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "controls", label: "Controls" },
    { id: "attacks",  label: "Attack Mapping" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header */}
      <div style={{
        ...card,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
            background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.3)",
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
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "3px" }}>
              Compliance Monitor
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              SOC 2 | ISO 27001 | GDPR | NIST CSF
            </div>
          </div>
          {data && <StatusBadge status={data.overall_status} large />}
        </div>

        <button
          onClick={load}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: "7px",
            padding: "8px 14px", borderRadius: "7px", cursor: loading ? "not-allowed" : "pointer",
            background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
            color: "var(--text-secondary)", fontFamily: "var(--font-mono)",
            fontSize: "10px", letterSpacing: "0.08em",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
            style={{ animation: loading ? "spin 1s linear infinite" : "none" }}>
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            <path d="M14 8A6 6 0 102 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {loading ? "REFRESHING..." : "REFRESH"}
        </button>
      </div>

      {/* Stat cards */}
      {data && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[
            { label: "ALERTS ANALYZED",    value: data.alerts_analyzed,     accent: "#818cf8" },
            { label: "CONTROLS TRIGGERED", value: data.controls_triggered,  accent: "#f87171" },
            { label: "FRAMEWORKS IMPACTED",value: data.frameworks_impacted, accent: "#fbbf24" },
            { label: "OVERALL IMPACT",     value: `${data.overall_pct}%`,   accent: STATUS_META[data.overall_status]?.color || "#818cf8" },
          ].map(s => (
            <div key={s.label} style={{
              flex: "1 1 140px",
              background: "var(--bg-surface)", borderRadius: "10px",
              border: "1px solid var(--border-subtle)",
              borderTop: `2px solid ${s.accent}`,
              padding: "16px 18px",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", color: "var(--text-muted)", marginBottom: "8px" }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "6px" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "8px 14px", borderRadius: "7px",
              border: tab === t.id ? "1px solid rgba(129,140,248,0.3)" : "1px solid transparent",
              background: tab === t.id ? "rgba(129,140,248,0.12)" : "transparent",
              color: tab === t.id ? "#818cf8" : "var(--text-muted)",
              fontFamily: "var(--font-mono)", fontSize: "10px",
              letterSpacing: "0.1em", cursor: "pointer", fontWeight: tab === t.id ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ ...card, border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.05)" }}>
          <div style={{ fontSize: "12px", color: "#f87171", fontFamily: "var(--font-mono)" }}>Error: {error}</div>
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div style={{ ...card, textAlign: "center", padding: "48px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
            LOADING COMPLIANCE DATA...
          </div>
        </div>
      )}

      {/* Tab content */}
      {data && !loading && (
        <>
          {tab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
              {Object.values(data.frameworks).map(fw => (
                <FrameworkCard key={fw.id} fw={fw} />
              ))}
            </div>
          )}
          {tab === "controls"  && <ControlsTab  data={data} />}
          {tab === "attacks"   && <AttackMappingTab data={data} />}
        </>
      )}

      {data && (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textAlign: "right", letterSpacing: "0.06em" }}>
          Last updated {new Date(data.generated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}















