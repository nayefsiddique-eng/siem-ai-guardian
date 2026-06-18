import { useState } from "react";
import { useSiem } from "../../hooks/useSiem";

export default function SentinelOpsView() {
  const { freeformQuery } = useSiem();

  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const result = await freeformQuery(query);
      setResponse(result);
    } catch (err) {
      setResponse({
        error: err.message,
      });
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          paddingBottom: "22px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          Sentinal-Ops
        </div>

        <div
          style={{
            marginTop: "10px",
            color: "var(--text-muted)",
            fontSize: "14px",
            lineHeight: 1.7,
            maxWidth: "720px",
          }}
        >
          Security Investigation Assistant powered by AI for threat analysis,
          incident response, MITRE ATT&CK mapping, and threat intelligence
          correlation.
        </div>
      </div>

      {/* Input Card */}
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(17,24,39,0.96), rgba(15,23,42,0.98))",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: "18px",
          padding: "28px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
        }}
      >
        <textarea
          rows={7}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question or investigate an alert..."
          style={{
            width: "100%",
            minHeight: "180px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "14px",
            padding: "18px",
            color: "white",
            fontSize: "14px",
            lineHeight: 1.7,
            resize: "vertical",
            outline: "none",
          }}
        />

        <button
          onClick={handleAsk}
          disabled={loading}
          style={{
            marginTop: "18px",
            padding: "12px 24px",
            borderRadius: "12px",
            border: "1px solid rgba(99,102,241,0.25)",
            background: "rgba(99,102,241,0.08)",
            color: "#a5b4fc",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Analyzing..." : "Send"}
        </button>
      </div>

      {/* Response */}
      {response && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "16px",
            padding: "24px",
            lineHeight: 1.8,
          }}
        >
          {/* IP Reputation */}
          {response.ip ? (
            <>
              <h3>IP Reputation Analysis</h3>

              <div><strong>IP Address:</strong> {response.ip}</div>
              <div><strong>Threat Level:</strong> {response.threat_level}</div>
              <div><strong>Abuse Score:</strong> {response.abuse_score}</div>
              <div><strong>Country:</strong> {response.country}</div>
              <div><strong>ISP:</strong> {response.isp}</div>
              <div><strong>Domain:</strong> {response.domain}</div>
              <div><strong>TOR Exit Node:</strong> {response.is_tor ? "Yes" : "No"}</div>
              <div><strong>Total Reports:</strong> {response.total_reports}</div>
            </>
          ) : response.id && response.name ? (
            <>
              <h3>MITRE ATT&CK Technique</h3>

              <div><strong>ID:</strong> {response.id}</div>
              <div><strong>Name:</strong> {response.name}</div>
              <div><strong>Tactic:</strong> {response.tactic}</div>
              <div><strong>Reference:</strong> {response.url}</div>
            </>
          ) : response.analysis ? (
            <>
              <h3>Alert Investigation</h3>

              <div>
                <strong>Threat Summary</strong>
                <br />
                {response.analysis.threat_summary}
              </div>

              <br />

              <div>
                <strong>Risk Level:</strong>{" "}
                {response.analysis.risk_level}
              </div>

              <div>
                <strong>Attack Stage:</strong>{" "}
                {response.analysis.attack_stage}
              </div>

              <br />

              <strong>Recommendations</strong>

              <ul>
                {response.analysis.recommendations?.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          ) : (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                overflowX: "auto",
                margin: 0,
              }}
            >
              {JSON.stringify(response, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}












