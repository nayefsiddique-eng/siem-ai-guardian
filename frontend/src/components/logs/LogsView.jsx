import { useState, useEffect, useCallback } from "react";
import { useSiem } from "../../hooks/useSiem";

const SEVERITY_DOT = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-yellow-500",
  low:      "bg-green-500",
};

export default function LogsView() {
  const { apiBase, ingestLog } = useSiem();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ source_ip: "", event_type: "", severity: "" });
  const [showIngest, setShowIngest] = useState(false);
  const [ingestForm, setIngestForm] = useState({
    source_ip: "192.168.1.100",
    event_type: "failed_login",
    severity: "medium",
    hostname: "web-server-01",
    username: "admin",
    log_source: "linux",
    raw_message: "",
  });
  const [ingestStatus, setIngestStatus] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200 });
      if (filters.source_ip) params.set("source_ip", filters.source_ip);
      if (filters.event_type) params.set("event_type", filters.event_type);
      if (filters.severity) params.set("severity", filters.severity);

      const res = await fetch(`${apiBase}/api/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [apiBase, filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleIngest = async () => {
    setIngestStatus("sending");
    try {
      const result = await ingestLog(ingestForm);
      setIngestStatus(result.alert_generated ? "alert" : "ok");
      fetchLogs();
    } catch (e) {
      setIngestStatus("error");
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Log Stream</h1>
          <p className="text-xs text-gray-500 mt-0.5">{logs.length} entries</p>
        </div>
        <button
          onClick={() => setShowIngest(!showIngest)}
          className="text-xs px-3 py-1.5 bg-cyan-900/50 text-cyan-400 border border-cyan-800 rounded hover:bg-cyan-900 transition-colors"
        >
          + Ingest Test Log
        </button>
      </div>

      {/* Test log ingestor */}
      {showIngest && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs text-cyan-500 uppercase tracking-wider mb-3">Inject Test Log Event</div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(ingestForm).map(([key, val]) => (
              key === "raw_message" ? (
                <div key={key} className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">{key}</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-2 py-1.5 font-mono"
                    value={val}
                    onChange={e => setIngestForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="Optional raw log message..."
                  />
                </div>
              ) : (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-1">{key}</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-2 py-1.5 font-mono"
                    value={val}
                    onChange={e => setIngestForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              )
            ))}
          </div>

          {/* Quick presets */}
          <div className="mt-3 flex gap-2 flex-wrap">
            <span className="text-xs text-gray-600">Presets:</span>
            {[
              { label: "Brute Force", event_type: "failed_login", source_ip: "10.0.0.55" },
              { label: "Port Scan", event_type: "port_probe", source_ip: "172.16.0.1", destination_port: "8080" },
              { label: "Sudo Escalation", event_type: "privilege_event", raw_message: "sudo su root executed by user" },
              { label: "After-Hours Login", event_type: "successful_login", source_ip: "203.0.113.42" },
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => setIngestForm(f => ({ ...f, ...preset }))}
                className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleIngest}
              disabled={ingestStatus === "sending"}
              className="text-xs px-4 py-1.5 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors disabled:opacity-50"
            >
              {ingestStatus === "sending" ? "Sending..." : "Send Log"}
            </button>
            {ingestStatus === "ok" && <span className="text-xs text-green-400">✓ Ingested (no alert)</span>}
            {ingestStatus === "alert" && <span className="text-xs text-orange-400">⚠ Ingested — Alert generated!</span>}
            {ingestStatus === "error" && <span className="text-xs text-red-400">✗ Failed — check backend</span>}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 items-center">
        {["source_ip", "event_type"].map(key => (
          <input
            key={key}
            placeholder={key.replace("_", " ")}
            value={filters[key]}
            onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
            className="bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded px-2 py-1.5 placeholder-gray-700 font-mono w-36"
          />
        ))}
        <select
          value={filters.severity}
          onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
          className="bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded px-2 py-1.5"
        >
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button onClick={fetchLogs} className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2">↺</button>
      </div>

      {/* Log table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 text-xs text-gray-600 px-4 py-2 border-b border-gray-800 uppercase tracking-wider">
          <span className="col-span-1">Sev</span>
          <span className="col-span-2">Timestamp</span>
          <span className="col-span-2">Source IP</span>
          <span className="col-span-2">Event Type</span>
          <span className="col-span-2">Host</span>
          <span className="col-span-3">Message</span>
        </div>

        <div className="font-mono text-xs max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-700">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-700">
              No logs yet — use "Ingest Test Log" above or send logs to POST /api/logs/ingest
            </div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className="grid grid-cols-12 px-4 py-2 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
              >
                <span className="col-span-1 flex items-center">
                  <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[log.severity] || "bg-gray-600"}`} />
                </span>
                <span className="col-span-2 text-gray-600 truncate">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="col-span-2 text-cyan-500 truncate">{log.source_ip}</span>
                <span className="col-span-2 text-yellow-600 truncate">{log.event_type}</span>
                <span className="col-span-2 text-gray-400 truncate">{log.hostname || "—"}</span>
                <span className="col-span-3 text-gray-600 truncate">{log.raw_message || log.username || "—"}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
