import { useEffect, useRef, useState } from "react";
import { useSiem } from "../../hooks/useSiem";

const SEV_COLOR = {
  critical: "var(--severity-critical)",
  high:     "var(--severity-high)",
  medium:   "var(--severity-medium)",
  low:      "var(--severity-low)",
  info:     "var(--text-muted)",
};

const TEST_EVENTS = [
  {
    label: "Brute Force",
    payload: {
      source_ip: "10.0.0.99", dest_ip: "192.168.1.1",
      event_type: "failed_login", severity: "high",
      hostname: "auth-server-01", username: "admin",
      raw_message: "Failed password for admin from 10.0.0.99 port 54321 ssh2",
    },
  },
  {
    label: "Port Scan",
    payload: {
      source_ip: "203.0.113.42", dest_ip: "10.10.10.5",
      event_type: "port_scan", severity: "medium",
      hostname: "firewall-01", username: "",
      raw_message: "Multiple connection attempts detected from 203.0.113.42",
    },
  },
  {
    label: "Priv Escalation",
    payload: {
      source_ip: "192.168.1.55", dest_ip: "192.168.1.1",
      event_type: "privilege_escalation", severity: "critical",
      hostname: "workstation-07", username: "jdoe",
      raw_message: "sudo su root executed by jdoe - UAC bypass attempted",
    },
  },
  {
    label: "Normal Login",
    payload: {
      source_ip: "192.168.1.10", dest_ip: "192.168.1.100",
      event_type: "successful_login", severity: "low",
      hostname: "dc-01", username: "svc_account",
      raw_message: "Accepted publickey for svc_account from 192.168.1.10",
    },
  },
];

function LogRow({ log }) {
  const sev = (log.severity || "-").toLowerCase();
  const color = SEV_COLOR[sev] || "-";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "72px 110px 110px 80px 1fr",
      alignItems: "center",
      gap: "12px",
      padding: "8px 16px",
      borderBottom: "1px solid var(--border-subtle)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "11px",
    }}
    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{ color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {sev}
      </span>
      <span style={{ color: "var(--text-muted)" }}>
        {log.source_ip || "-"}
      </span>
      <span style={{ color: "var(--text-muted)" }}>
        {log.dest_ip || "-"}
      </span>
      <span style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {log.event_type || "-"}
      </span>
      <span style={{
        color: "var(--text-secondary)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: "10px",
      }}>
        {log.raw_message || "-"}
      </span>
    </div>
  );
}

export default function LogsView() {
  const { logs, fetchLogs, ingestLog } = useSiem();
  const [injecting, setInjecting] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleInject = async (evt) => {
    setInjecting(evt.label);
    await ingestLog(evt.payload);
    await fetchLogs();
    setInjecting(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Inject toolbar */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "8px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          color: "var(--text-muted)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginRight: "4px",
        }}>
          Inject Test Event
        </span>
        {TEST_EVENTS.map(evt => (
          <button
            key={evt.label}
            onClick={() => handleInject(evt)}
            disabled={injecting === evt.label}
            style={{
              padding: "6px 13px",
              borderRadius: "5px",
              border: "1px solid var(--border-default)",
              background: injecting === evt.label ? "var(--bg-elevated)" : "transparent",
              color: injecting === evt.label ? "var(--text-muted)" : "var(--text-secondary)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.06em",
              cursor: injecting === evt.label ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              if (injecting !== evt.label) {
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={e => {
              if (injecting !== evt.label) {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
          >
            {injecting === evt.label ? "Injecting..." : `+ ${evt.label}`}
          </button>
        ))}
        <button
          onClick={fetchLogs}
          style={{
            marginLeft: "auto",
            padding: "6px 13px",
            borderRadius: "5px",
            border: "1px solid rgba(34,211,238,0.25)",
            background: "rgba(34,211,238,0.06)",
            color: "var(--accent-cyan)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          ? Refresh
        </button>
      </div>

      {/* Log stream */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "8px",
        overflow: "hidden",
      }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "72px 110px 110px 80px 1fr",
          gap: "12px",
          padding: "9px 16px",
          background: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          {["Severity", "Source IP", "Dest IP", "Type", "Message"].map(h => (
            <span key={h} style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}>
              {h}
            </span>
          ))}
        </div>

        <div style={{ maxHeight: "520px", overflowY: "auto" }}>
          {(!logs || logs.length === 0) ? (
            <div style={{
              padding: "40px",
              textAlign: "center",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: "var(--text-muted)",
            }}>
              No logs yet. Inject a test event to begin.
            </div>
          ) : (
            [...logs].reverse().map((log, i) => (
              <LogRow key={log.id || i} log={log} />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{
          padding: "8px 16px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: "var(--text-muted)",
          }}>
            {logs?.length || 0} events indexed
          </span>
          <span style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: "var(--severity-low)",
          }}>
            <span style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: "var(--severity-low)",
              boxShadow: "0 0 5px rgba(52,211,153,0.8)",
            }} />
            Live
          </span>
        </div>
      </div>
    </div>
  );
}





















