import { useState } from "react";
import { useSiem } from "../../hooks/useSiem";

const SUGGESTED = [
  "Show all brute force attacks in the last hour",
  "Which source IPs appear most in critical alerts?",
  "Summarize privilege escalation attempts today",
  "Is there evidence of lateral movement?",
];

export default function AnalysisView() {
  const { freeformQuery } = useSiem();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const submit = async (q) => {
    const text = q || query;
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await freeformQuery(text);
    const entry = { query: text, result: res, ts: new Date() };
    setHistory(h => [entry, ...h]);
    setResult(res);
    setQuery("");
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Input panel */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "10px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          color: "var(--text-muted)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}>
          Freeform Incident Query
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Describe what you want to investigate…"
            rows={3}
            style={{
              flex: 1,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              borderRadius: "6px",
              padding: "12px 14px",
              color: "var(--text-primary)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              resize: "none",
              outline: "none",
              lineHeight: 1.6,
              transition: "border-color 0.15s",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => e.target.style.borderColor = "var(--border-default)"}
          />
          <button
            onClick={() => submit()}
            disabled={loading || !query.trim()}
            style={{
              alignSelf: "flex-end",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid rgba(99,102,241,0.4)",
              background: loading || !query.trim()
                ? "var(--bg-elevated)"
                : "rgba(99,102,241,0.12)",
              color: loading || !query.trim()
                ? "var(--text-muted)"
                : "var(--accent-indigo)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.08em",
              cursor: loading || !query.trim() ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "QUERYING…" : "⚡ QUERY"}
          </button>
        </div>

        {/* Suggestions */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {SUGGESTED.map(s => (
            <button
              key={s}
              onClick={() => submit(s)}
              style={{
                padding: "5px 11px",
                borderRadius: "5px",
                border: "1px solid var(--border-subtle)",
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: "11px",
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "10px",
          padding: "32px",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{
            animation: "spin 1.2s linear infinite",
          }}>
            <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
            <circle cx="8" cy="8" r="6" stroke="var(--accent-indigo)" strokeWidth="1.5" strokeDasharray="20 18" strokeLinecap="round"/>
          </svg>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            color: "var(--accent-indigo)",
            letterSpacing: "0.1em",
          }}>
            AI PROCESSING QUERY…
          </span>
        </div>
      )}

      {/* Latest result */}
      {result && !loading && (
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid rgba(99,102,241,0.20)",
          borderRadius: "10px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            color: "var(--accent-indigo)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}>
            AI Response
          </div>
          <p style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}>
            {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
          </p>
        </div>
      )}

      {/* Query history */}
      {history.length > 1 && (
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "10px",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border-subtle)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            color: "var(--text-muted)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}>
            Query History
          </div>
          {history.slice(1).map((h, i) => (
            <div
              key={i}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                }}>
                  {h.query}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                }}>
                  {h.ts.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
