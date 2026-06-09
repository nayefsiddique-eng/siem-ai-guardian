import { useState, useEffect } from "react";
import { useSiem } from "../../hooks/useSiem";

const SEVERITY_STYLES = {
  critical: "bg-red-900/40 text-red-400 border-red-800",
  high:     "bg-orange-900/40 text-orange-400 border-orange-800",
  medium:   "bg-yellow-900/40 text-yellow-400 border-yellow-800",
  low:      "bg-green-900/40 text-green-400 border-green-800",
};

const STATUS_STYLES = {
  open:            "text-red-400",
  investigating:   "text-yellow-400",
  resolved:        "text-green-400",
  false_positive:  "text-gray-500",
};

function AlertCard({ alert, onStatusChange, onAnalyze }) {
  const [expanding, setExpanding] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await onAnalyze(alert.id);
      setAnalysis(result.analysis);
      setExpanding(true);
    } catch (e) {
      alert("AI analysis failed — check Gemini API key in backend .env");
    } finally {
      setAnalyzing(false);
    }
  };

  const aiData = analysis || {
    threat_summary: alert.ai_analysis,
    risk_level: alert.ai_risk_level,
    recommendations: alert.ai_recommendations,
  };

  return (
    <div className={`bg-gray-900 rounded-lg border ${SEVERITY_STYLES[alert.severity] || "border-gray-800"} overflow-hidden`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className={`text-xs px-2 py-0.5 rounded border uppercase font-bold flex-shrink-0 ${SEVERITY_STYLES[alert.severity] || "border-gray-700 text-gray-400"}`}>
            {alert.severity}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-100 font-medium">{alert.title}</div>
            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{alert.description}</div>
          </div>
          <span className={`text-xs flex-shrink-0 ${STATUS_STYLES[alert.status] || "text-gray-500"}`}>
            {alert.status}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="font-mono text-cyan-500">{alert.source_ip}</span>
          {alert.mitre_technique_id && (
            <span className="text-purple-400">
              {alert.mitre_technique_id} · {alert.mitre_technique_name}
            </span>
          )}
          <span>{alert.mitre_tactic}</span>
          <span className="ml-auto">{new Date(alert.created_at).toLocaleString()}</span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="text-xs px-3 py-1 rounded bg-cyan-900/50 text-cyan-400 border border-cyan-800 hover:bg-cyan-900 transition-colors disabled:opacity-50"
          >
            {analyzing ? "Analyzing..." : "✦ AI Analysis"}
          </button>
          <button
            onClick={() => setExpanding(!expanding)}
            className="text-xs px-3 py-1 rounded bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
          >
            {expanding ? "Collapse" : "Details"}
          </button>
          {alert.status === "open" && (
            <button
              onClick={() => onStatusChange(alert.id, "investigating")}
              className="text-xs px-3 py-1 rounded bg-yellow-900/30 text-yellow-400 border border-yellow-900 hover:bg-yellow-900/50 transition-colors"
            >
              Investigate
            </button>
          )}
          {alert.status === "investigating" && (
            <button
              onClick={() => onStatusChange(alert.id, "resolved")}
              className="text-xs px-3 py-1 rounded bg-green-900/30 text-green-400 border border-green-900 hover:bg-green-900/50 transition-colors"
            >
              Resolve
            </button>
          )}
          <button
            onClick={() => onStatusChange(alert.id, "false_positive")}
            className="text-xs px-2 py-1 text-gray-600 hover:text-gray-400 transition-colors"
          >
            False Positive
          </button>
        </div>
      </div>

      {/* Expanded AI analysis */}
      {expanding && aiData.threat_summary && (
        <div className="border-t border-gray-800 p-4 bg-gray-950/50">
          <div className="text-xs text-cyan-500 uppercase tracking-wider mb-3">✦ AI Analysis</div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">Threat Summary</div>
              <div className="text-sm text-gray-300">{aiData.threat_summary}</div>
            </div>
            {aiData.risk_level && (
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-600">Risk Level:</div>
                <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${SEVERITY_STYLES[aiData.risk_level] || "text-gray-400"}`}>
                  {aiData.risk_level}
                </span>
              </div>
            )}
            {aiData.recommendations?.length > 0 && (
              <div>
                <div className="text-xs text-gray-600 mb-1">Recommendations</div>
                <ul className="space-y-1">
                  {aiData.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-gray-300 flex gap-2">
                      <span className="text-cyan-600 flex-shrink-0">→</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlertsView() {
  const { alerts, fetchAlerts, updateAlertStatus, triggerAiAnalysis, loading } = useSiem();
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  useEffect(() => {
    const filters = {};
    if (statusFilter) filters.status = statusFilter;
    if (severityFilter) filters.severity = severityFilter;
    fetchAlerts(filters);
  }, [statusFilter, severityFilter]);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Alerts</h1>
          <p className="text-xs text-gray-500 mt-0.5">{alerts.length} alerts shown</p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1.5"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1.5"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Alert list */}
      {loading && alerts.length === 0 ? (
        <div className="text-center text-gray-600 py-16">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 text-gray-700">◈</div>
          <div className="text-gray-600 text-sm">No alerts match your filters</div>
          <div className="text-gray-700 text-xs mt-1">Try ingesting some test logs via the API</div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onStatusChange={updateAlertStatus}
              onAnalyze={triggerAiAnalysis}
            />
          ))}
        </div>
      )}
    </div>
  );
}
