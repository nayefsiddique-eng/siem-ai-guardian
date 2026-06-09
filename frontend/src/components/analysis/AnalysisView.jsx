import { useState } from "react";
import { useSiem } from "../../hooks/useSiem";

const EXAMPLE_QUERIES = [
  "20 failed SSH logins from IP 185.220.101.45 in 2 minutes, then a successful login from the same IP",
  "User 'jsmith' logged in from New York at 9am, then from Singapore 20 minutes later",
  "Firewall blocked 500 connection attempts across ports 22, 3389, 445, 1433 from 10.0.0.88 in 30 seconds",
  "Root process spawned an outbound connection to 198.51.100.42 on port 4444 at 3am",
];

const RISK_COLORS = {
  critical: "text-red-400",
  high:     "text-orange-400",
  medium:   "text-yellow-400",
  low:      "text-green-400",
};

export default function AnalysisView() {
  const { apiBase } = useSiem();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${apiBase}/api/analysis/freeform`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: query }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-100">AI Threat Analysis</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Describe any security incident in plain English — Gemini will analyze it.
        </p>
      </div>

      {/* Query box */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <div className="text-xs text-cyan-500 uppercase tracking-wider">Incident Context</div>
        <textarea
          rows={5}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Describe the security event or paste log context here..."
          className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-2 font-mono placeholder-gray-700 resize-none focus:outline-none focus:border-cyan-700"
        />

        {/* Example queries */}
        <div className="space-y-1">
          <div className="text-xs text-gray-600">Examples:</div>
          {EXAMPLE_QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuery(q)}
              className="block text-left text-xs text-gray-500 hover:text-cyan-400 transition-colors leading-relaxed"
            >
              → {q}
            </button>
          ))}
        </div>

        <button
          onClick={analyze}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Analyzing with Gemini..." : "✦ Analyze"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-950/40 border border-red-800 rounded-lg p-4 text-sm text-red-400">
          ✗ {error}
          {error.includes("API key") && (
            <div className="text-xs text-red-600 mt-1">
              Add GEMINI_API_KEY to backend/.env and restart the server.
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-gray-900 border border-cyan-900/50 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-cyan-950/30 border-b border-cyan-900/50 flex items-center justify-between">
            <span className="text-xs text-cyan-400 uppercase tracking-wider">✦ Gemini Analysis</span>
            <span className={`text-sm font-bold uppercase ${RISK_COLORS[result.risk_level] || "text-gray-400"}`}>
              {result.risk_level} Risk
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* Threat summary */}
            <div>
              <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Threat Summary</div>
              <p className="text-sm text-gray-200 leading-relaxed">{result.threat_summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Attack type */}
              {result.likely_attack_type && (
                <div>
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Attack Type</div>
                  <div className="text-sm text-orange-400">{result.likely_attack_type}</div>
                </div>
              )}

              {/* Confidence */}
              {result.confidence && (
                <div>
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Confidence</div>
                  <div className="text-sm text-gray-300 capitalize">{result.confidence}</div>
                </div>
              )}
            </div>

            {/* MITRE techniques */}
            {result.mitre_techniques?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">MITRE ATT&CK</div>
                <div className="flex flex-wrap gap-2">
                  {result.mitre_techniques.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-purple-900/40 text-purple-400 border border-purple-800 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Recommendations</div>
                <ul className="space-y-1.5">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-cyan-600 flex-shrink-0 mt-0.5">→</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Investigation steps */}
            {result.investigation_steps?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Investigation Steps</div>
                <ol className="space-y-1.5">
                  {result.investigation_steps.map((step, i) => (
                    <li key={i} className="text-sm text-gray-400 flex gap-2">
                      <span className="text-gray-600 flex-shrink-0 tabular-nums">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
