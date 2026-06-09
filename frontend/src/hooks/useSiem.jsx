import { createContext, useContext, useState, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SiemContext = createContext(null);

async function api(path, opts = {}) {
  try {
    const token = localStorage.getItem("siem_token");
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
      ...opts,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export function SiemProvider({ children }) {
  const [stats, setStats]   = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs]     = useState([]);

  const fetchStats  = useCallback(async () => { const d = await api("/api/dashboard/stats"); if (d) setStats(d); }, []);
  const fetchAlerts = useCallback(async () => { const d = await api("/api/alerts"); if (d) setAlerts(Array.isArray(d) ? d : d.alerts || []); }, []);
  const fetchLogs   = useCallback(async () => { const d = await api("/api/logs");   if (d) setLogs(Array.isArray(d) ? d : d.logs || []); }, []);

  const ingestLog = useCallback(async (payload) =>
    await api("/api/logs/ingest", { method: "POST", body: JSON.stringify(payload) }), []);

  const analyzeAlert = useCallback(async (id) => {
    const d = await api(`/api/alerts/${id}/analyze`, { method: "POST" });
    if (d) setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...d } : a));
    return d;
  }, []);

  const updateAlertStatus = useCallback(async (id, status) => {
    const d = await api(`/api/alerts/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    if (d) setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    return d;
  }, []);

  const freeformQuery = useCallback(async (query) => {
    const d = await api("/api/analysis/freeform", { method: "POST", body: JSON.stringify({ query }) });
    return d?.response || d?.result || JSON.stringify(d);
  }, []);

  return (
    <SiemContext.Provider value={{ stats, alerts, logs, fetchStats, fetchAlerts, fetchLogs, ingestLog, analyzeAlert, updateAlertStatus, freeformQuery }}>
      {children}
    </SiemContext.Provider>
  );
}

export function useSiem() {
  const ctx = useContext(SiemContext);
  if (!ctx) throw new Error("useSiem must be inside SiemProvider");
  return ctx;
}
