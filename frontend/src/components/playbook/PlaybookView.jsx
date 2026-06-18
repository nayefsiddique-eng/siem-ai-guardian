import { useState, useEffect } from "react";
import { useSiem } from "../../hooks/useSiem";

export default function PlaybookView() {
  const { alerts, fetchAlerts } = useSiem();
  const [selected, setSelected] = useState(null);
  const [playbook, setPlaybook] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const isPending  = playbook?.status === "pending_approval";
  const isApproved = playbook?.status === "approved";
  const isRejected = playbook?.status === "rejected";

  useEffect(() => { fetchAlerts(); }, []);

  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const token = () => localStorage.getItem("siem_token");

  const generate = async () => {
    if (!selected) return;
    setLoading(true); setPlaybook(null); setStatus(null);
    try {
      const res = await fetch(BASE + "/api/playbooks/" + selected.id + "/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setPlaybook(data);
    } catch { setStatus({ type: "error", msg: "Failed to generate playbook." }); }
    setLoading(false);
  };

  const approve = async () => {
    if (!playbook || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        BASE + "/api/playbooks/" + playbook.alert_id + "/approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const data = await res.json();

      if (res.ok) {
        setPlaybook(data.playbook);
        setStatus({
          type: "success",
          msg: "Playbook approved successfully."
        });
      } else {
        setStatus({
          type: "error",
          msg: data.detail || "Approval failed."
        });
      }
    } catch {
      setStatus({
        type: "error",
        msg: "Approval request failed."
      });
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!playbook || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        BASE + "/api/playbooks/" + playbook.alert_id + "/reject",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            reason: "Rejected by analyst"
          })
        }
      );

      const data = await res.json();

      if (res.ok) {
        setPlaybook(data.playbook);
        setStatus({
          type: "warn",
          msg: "Playbook rejected."
        });
      } else {
        setStatus({
          type: "error",
          msg: data.detail || "Rejection failed."
        });
      }
    } catch {
      setStatus({
        type: "error",
        msg: "Rejection request failed."
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openAlerts = (alerts || []).filter(a => a.status === "open" || a.status === "investigating");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {status && (
        <div style={{
          padding: "12px 18px", borderRadius: "9px", fontSize: "13px", fontWeight: 600,
          background: status.type === "success" ? "rgba(52,211,153,0.1)" : status.type === "error" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)",
          border: "1px solid " + (status.type === "success" ? "rgba(52,211,153,0.3)" : status.type === "error" ? "rgba(248,113,113,0.3)" : "rgba(251,191,36,0.3)"),
          color: status.type === "success" ? "#34d399" : status.type === "error" ? "#f87171" : "#fbbf24",
        }}>
          {status.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "20px" }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#f0f2f7", marginBottom: "4px" }}>Response Playbooks</div>
        <div style={{ fontSize: "12px", color: "#5a6480" }}>Select an active alert, generate an AI response playbook, then approve or reject it.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Alert selector */}
        <div style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: "11px", fontWeight: 600, color: "#5a6480", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Active Alerts | {openAlerts.length} available
          </div>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {openAlerts.length === 0
              ? <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#3d4660" }}>No open alerts. Inject test events first.</div>
              : openAlerts.map(a => {
                  const SEV_COLOR = { critical: "#f87171", high: "#fb923c", medium: "#fbbf24", low: "#34d399" };
                  const color = SEV_COLOR[a.severity] || "#5a6480";
                  const on = selected?.id === a.id;
                  return (
                    <div key={a.id} onClick={() => { setSelected(a); setPlaybook(null); setStatus(null); }}
                      style={{
                        padding: "14px 18px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)",
                        background: on ? "rgba(129,140,248,0.1)" : "transparent",
                        borderLeft: "3px solid " + (on ? "#818cf8" : "transparent"),
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { if (!on) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                      onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#f0f2f7" }}>{a.event_type || "Unknown Event"}</span>
                        <span style={{ fontSize: "10px", fontWeight: 700, color, fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                          {(a.severity || "low").toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#5a6480", fontFamily: "var(--font-mono)" }}>
                        {a.source_ip || "-"} {" → "} {a.dest_ip || "-"}
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* Playbook panel */}
        <div style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#5a6480", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              AI Playbook
            </span>
            <button onClick={generate} disabled={!selected || loading} style={{
              padding: "7px 16px", borderRadius: "7px", cursor: !selected || loading ? "not-allowed" : "pointer",
              background: !selected || loading ? "rgba(255,255,255,0.04)" : "rgba(129,140,248,0.14)",
              border: "1px solid rgba(129,140,248,0.35)",
              color: !selected || loading ? "#3d4660" : "#818cf8",
              fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-mono)", letterSpacing: "0.06em",
            }}>
              {loading ? "GENERATING..." : "GENERATE PLAYBOOK"}
            </button>
          </div>

          <div style={{ flex: 1, padding: "18px", overflowY: "auto", maxHeight: "none" }}>
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "24px 0" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: "spin 1.2s linear infinite" }}>
                  <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
                  <circle cx="9" cy="9" r="7" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="22 20" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: "13px", color: "#818cf8", fontFamily: "var(--font-mono)" }}>AI GENERATING PLAYBOOK...</span>
              </div>
            )}

            {!loading && !playbook && !selected && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#3d4660", fontSize: "13px" }}>
                Select an alert to begin
              </div>
            )}

            {!loading && !playbook && selected && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: "13px", color: "#a8b3cc", marginBottom: "8px" }}>Ready to generate playbook for:</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#818cf8" }}>{selected.event_type}</div>
                <div style={{ fontSize: "12px", color: "#5a6480", marginTop: "4px" }}>{selected.source_ip}</div>
              </div>
            )}

            {!loading && playbook && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

  <div>
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <span style={{ fontSize: "26px", fontWeight: 700 }}>
        {playbook.playbook_name}
      </span>
      {isApproved && (
        <span style={{ padding: "4px 12px", borderRadius: "99px", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
          APPROVED
        </span>
      )}
      {isRejected && (
        <span style={{ padding: "4px 12px", borderRadius: "99px", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
          REJECTED
        </span>
      )}
    </div>

    <div style={{ marginTop: "10px", color: "#94a3b8" }}>
      Risk Level:
      <span style={{ color: "#f87171", marginLeft: "8px", fontWeight: 700 }}>
        {playbook.risk_level?.toUpperCase()}
      </span>
    </div>
  </div>

  <div>
    <div style={{ fontWeight: 700, marginBottom: "10px" }}>
      Threat Summary
    </div>

    <div style={{ color: "#cbd5e1", lineHeight: 1.8 }}>
      {(playbook.threat_summary || "").replace(/\uFFFD/g, "-")}
    </div>
  </div>

  <div>
    <div style={{ fontWeight: 700 }}>
      Estimated Response Time
    </div>

    <div style={{ color: "#cbd5e1" }}>
      {playbook.estimated_time_minutes} minutes
    </div>
  </div>

  <div>
    <div style={{ fontWeight: 700, marginBottom: "16px" }}>
      Response Steps
    </div>

    {playbook.steps?.map((step) => (
      <div
        key={step.step_number}
        style={{
          padding: "18px",
          marginBottom: "16px",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "14px"
        }}
      >

        <div style={{ fontWeight: 700 }}>
          Step {step.step_number} - {(step.action || "").replace(/\uFFFD/g, "-")}
        </div>

        <div style={{
          marginTop: "10px",
          color: "#94a3b8",
          lineHeight: 1.7
        }}>
          {(step.description || "").replace(/\uFFFD/g, "-")}
        </div>

        {step.command && (
          <div style={{
            marginTop: "14px",
            padding: "12px",
            background: "#0f172a",
            borderRadius: "10px",
            fontFamily: "monospace",
            color: "#38bdf8"
          }}>
            {step.command}
          </div>
        )}

        <div style={{
          marginTop: "14px",
          fontSize: "13px",
          color: "#94a3b8"
        }}>
          Approval Required: {step.requires_approval ? "Yes" : "No"}
        </div>

      </div>
    ))}
  </div>

  <div>
    <div style={{ fontWeight: 700 }}>
      Rollback Plan
    </div>

    <div style={{ color: "#cbd5e1", marginTop: "8px" }}>
      {playbook.rollback_plan}
    </div>
  </div>

</div>
              </div>
            )}
          </div>

          {playbook && !loading && isPending && (
            <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "8px", position: "relative", zIndex: 9999 }}>
              <button disabled={actionLoading} onClick={approve} style={{
                flex: 1, padding: "10px", borderRadius: "8px", cursor: actionLoading ? "not-allowed" : "pointer",
                background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
                color: "#34d399", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-mono)",
                opacity: actionLoading ? 0.5 : 1,
              }}>
                {actionLoading ? "APPROVING..." : "APPROVE"}
              </button>
              <button disabled={actionLoading} onClick={reject} style={{
                flex: 1, padding: "10px", borderRadius: "8px", cursor: actionLoading ? "not-allowed" : "pointer",
                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                color: "#f87171", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-mono)",
                opacity: actionLoading ? 0.5 : 1,
              }}>
                {actionLoading ? "REJECTING..." : "REJECT"}
              </button>
            </div>
          )}

          {playbook && !loading && !isPending && (
            <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
              <div style={{
                padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
                background: isApproved ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
                border: "1px solid " + (isApproved ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"),
                color: isApproved ? "#34d399" : "#f87171",
                fontFamily: "var(--font-mono)", textTransform: "uppercase"
              }}>
                Playbook {playbook.status} {playbook.approved_by ? `by ${playbook.approved_by}` : playbook.rejected_by ? `by ${playbook.rejected_by}` : ""}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}













































