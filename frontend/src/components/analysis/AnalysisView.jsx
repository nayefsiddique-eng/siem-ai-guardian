import { useState } from "react";
import { useSiem } from "../../hooks/useSiem";

const SUGGESTIONS = [
  "20 failed SSH logins from 185.220.101.45 in 2 minutes then a successful login",
  "User logged in from India at 9am then from UK 15 minutes later",
  "Root process spawned outbound connection to 198.51.100.42 on port 4444 at 3am",
  "500 connection attempts across ports 22, 3389, 445 from same IP in 30 seconds",
];

const RISK_COLOR = {
  critical: "var(--severity-critical)",
  high:     "var(--severity-high)",
  medium:   "var(--severity-medium)",
  low:      "var(--severity-low)",
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

function QueryPanel() {
  const { freeformQuery } = useSiem();
  const [query, setQuery]     = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const submit = async (q) => {
    const text = q || query;
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await freeformQuery(text);
      if (!res) throw new Error("No response -- check GEMINI_API_KEY in backend .env");
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: 720 }}>
      <div style={card}>
        <div style={monoLabel}>AI Threat Intelligence Query</div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px", lineHeight: 1.6 }}>
          Describe any security incident in plain English. The AI will analyze it, identify the
          attack type, map to MITRE ATT&CK, and recommend actions.
        </div>

        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }}}
          placeholder="e.g. 15 failed logins from same IP followed by successful login at 3am..."
          rows={4}
          style={{
            width: "100%", background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)", borderRadius: "8px",
            padding: "12px 14px", color: "var(--text-primary)",
            fontFamily: "var(--font-mono)", fontSize: "12px",
            resize: "none", outline: "none", lineHeight: 1.6,
          }}
          onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
          onBlur={e => e.target.style.borderColor = "var(--border-default)"}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "5px", margin: "10px 0" }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => submit(s)} style={{
              textAlign: "left", padding: "6px 10px", borderRadius: "6px",
              border: "1px solid var(--border-subtle)", background: "transparent",
              color: "var(--text-muted)", fontSize: "11px", cursor: "pointer",
              fontFamily: "inherit", lineHeight: 1.4,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
            >
              {">"} {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => submit()}
          disabled={loading || !query.trim()}
          style={{
            width: "100%", padding: "10px",
            background: loading || !query.trim() ? "var(--bg-elevated)" : "rgba(99,102,241,0.15)",
            border: `1px solid ${loading || !query.trim() ? "var(--border-subtle)" : "rgba(99,102,241,0.4)"}`,
            borderRadius: "8px",
            color: loading || !query.trim() ? "var(--text-muted)" : "var(--accent-indigo)",
            fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em",
            cursor: loading || !query.trim() ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "ANALYZING..." : "ANALYZE THREAT"}
        </button>
      </div>

      {error && (
        <div style={{ ...card, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.05)" }}>
          <div style={{ fontSize: "12px", color: "var(--severity-critical)" }}>Error: {error}</div>
        </div>
      )}

      {result && !loading && (
        <div style={{ ...card, border: "1px solid rgba(99,102,241,0.2)" }}>
          <div style={monoLabel}>AI Analysis Result</div>
          {typeof result === "object" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {result.risk_level && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Risk Level</span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: RISK_COLOR[result.risk_level] || "var(--text-secondary)",
                    padding: "2px 8px", borderRadius: "4px",
                    background: `${RISK_COLOR[result.risk_level] || "#fff"}15`,
                  }}>{result.risk_level}</span>
                </div>
              )}
              {result.threat_summary && (
                <div>
                  <div style={{ ...monoLabel, marginBottom: "6px" }}>Threat Summary</div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>{result.threat_summary}</p>
                </div>
              )}
              {result.mitre_techniques?.length > 0 && (
                <div>
                  <div style={{ ...monoLabel, marginBottom: "8px" }}>MITRE ATT&CK</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {result.mitre_techniques.map((t, i) => (
                      <span key={i} style={{
                        fontFamily: "var(--font-mono)", fontSize: "10px",
                        padding: "3px 8px", borderRadius: "4px",
                        background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)",
                        color: "#a78bfa",
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.recommendations?.length > 0 && (
                <div>
                  <div style={{ ...monoLabel, marginBottom: "8px" }}>Recommendations</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {result.recommendations.map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        <span style={{ color: "var(--accent-cyan)", flexShrink: 0 }}>{"→"}</span>{r}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.investigation_steps?.length > 0 && (
                <div>
                  <div style={{ ...monoLabel, marginBottom: "8px" }}>Investigation Steps</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {result.investigation_steps.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                        <span style={{ fontFamily: "var(--font-mono)", flexShrink: 0 }}>{i + 1}.</span>{s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{String(result)}</p>
          )}
        </div>
      )}
    </div>
  );
}

function PlaybookPanel() {
  const { alerts } = useSiem();
  const [selectedAlert, setSelectedAlert] = useState("");
  const [playbook, setPlaybook]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [status, setStatus]       = useState(null);

  const openAlerts = alerts.filter(a => a.status === "open");

  const generate = async () => {
    if (!selectedAlert) return;
    setLoading(true);
    setPlaybook(null);
    setError(null);
    setStatus(null);
    try {
      const token = localStorage.getItem("siem_token");
      const res = await fetch(`http://localhost:8000/api/playbooks/${selectedAlert}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} -- make sure you are logged in`);
      const data = await res.json();
      setPlaybook(data);
      setStatus(data.status);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const act = async (action) => {
    const token = localStorage.getItem("siem_token");
    const res = await fetch(`http://localhost:8000/api/playbooks/${selectedAlert}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: action === "reject" ? JSON.stringify({ reason: "Rejected by analyst" }) : undefined,
    });
    if (res.ok) {
      setStatus(action === "approve" ? "approved" : "rejected");
      setPlaybook(p => ({ ...p, status: action === "approve" ? "approved" : "rejected" }));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: 720 }}>
      <div style={card}>
        <div style={monoLabel}>Agentic Response Playbook</div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px", lineHeight: 1.6 }}>
          Select an open alert. AI generates a step-by-step response playbook.
          You review and approve before any action executes.
        </div>

        {openAlerts.length === 0 ? (
          <div style={{
            padding: "16px", borderRadius: "8px", background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)", textAlign: "center",
            fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px",
          }}>
            No open alerts -- ingest logs first to generate alerts
          </div>
        ) : (
          <select
            value={selectedAlert}
            onChange={e => { setSelectedAlert(e.target.value); setPlaybook(null); setStatus(null); }}
            style={{
              width: "100%", background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)", borderRadius: "8px",
              padding: "10px 12px", color: "var(--text-primary)",
              fontFamily: "var(--font-mono)", fontSize: "12px",
              outline: "none", marginBottom: "12px", cursor: "pointer",
            }}
          >
            <option value="">-- Select an open alert --</option>
            {openAlerts.map(a => (
              <option key={a.id} value={a.id}>
                [{(a.severity || "").toUpperCase()}] {(a.title || "").slice(0, 55)}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={generate}
          disabled={loading || !selectedAlert}
          style={{
            width: "100%", padding: "10px",
            background: loading || !selectedAlert ? "var(--bg-elevated)" : "rgba(34,211,238,0.1)",
            border: `1px solid ${loading || !selectedAlert ? "var(--border-subtle)" : "rgba(34,211,238,0.35)"}`,
            borderRadius: "8px",
            color: loading || !selectedAlert ? "var(--text-muted)" : "var(--accent-cyan)",
            fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em",
            cursor: loading || !selectedAlert ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "GENERATING PLAYBOOK..." : "GENERATE PLAYBOOK"}
        </button>
      </div>

      {error && (
        <div style={{ ...card, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.05)" }}>
          <div style={{ fontSize: "12px", color: "var(--severity-critical)" }}>Error: {error}</div>
        </div>
      )}

      {playbook && !loading && (
        <div style={{ ...card, border: "1px solid rgba(34,211,238,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ ...monoLabel, marginBottom: 0, color: "var(--accent-cyan)" }}>Response Playbook</div>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.1em",
              textTransform: "uppercase", padding: "2px 8px", borderRadius: "4px",
              background: status === "approved" ? "rgba(52,211,153,0.1)" : status === "rejected" ? "rgba(239,68,68,0.1)" : "rgba(251,191,36,0.1)",
              border: `1px solid ${status === "approved" ? "rgba(52,211,153,0.3)" : status === "rejected" ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.3)"}`,
              color: status === "approved" ? "var(--severity-low)" : status === "rejected" ? "var(--severity-critical)" : "var(--severity-medium)",
            }}>
              {(status || "").replace("_", " ").toUpperCase()}
            </span>
          </div>

          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: 1.6 }}>
            {playbook.threat_summary}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {playbook.steps?.map((step, i) => (
              <div key={i} style={{
                background: "var(--bg-elevated)", borderRadius: "8px",
                border: "1px solid var(--border-subtle)", padding: "12px 14px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700,
                    color: "var(--accent-cyan)", flexShrink: 0,
                    width: 22, height: 22, borderRadius: "50%",
                    background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {step.step_number}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "3px" }}>
                      {step.action}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      {step.description}
                    </div>
                    {step.command && (
                      <div style={{
                        fontFamily: "var(--font-mono)", fontSize: "10px",
                        marginTop: "6px", padding: "5px 8px", borderRadius: "4px",
                        background: "rgba(0,0,0,0.3)", color: "var(--accent-cyan)",
                        border: "1px solid var(--border-subtle)",
                      }}>
                        $ {step.command}
                      </div>
                    )}
                  </div>
                  {step.requires_approval && (
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.08em",
                      color: "var(--severity-medium)", flexShrink: 0,
                      padding: "2px 6px", borderRadius: "3px",
                      background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
                    }}>APPROVAL</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {status === "pending_approval" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => act("approve")} style={{
                flex: 1, padding: "10px",
                background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.35)",
                borderRadius: "8px", color: "var(--severity-low)",
                fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer",
              }}>APPROVE AND EXECUTE</button>
              <button onClick={() => act("reject")} style={{
                flex: 1, padding: "10px",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "8px", color: "var(--severity-critical)",
                fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer",
              }}>REJECT</button>
            </div>
          )}

          {status === "approved" && (
            <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", textAlign: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--severity-low)", letterSpacing: "0.1em" }}>
                PLAYBOOK APPROVED -- ACTIONS AUTHORIZED
              </span>
            </div>
          )}

          {status === "rejected" && (
            <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", textAlign: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--severity-critical)", letterSpacing: "0.1em" }}>
                PLAYBOOK REJECTED
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalysisView({ mode = "query" }) {
  return mode === "playbook" ? <PlaybookPanel /> : <QueryPanel />;
}
