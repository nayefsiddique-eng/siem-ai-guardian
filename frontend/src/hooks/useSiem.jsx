import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SiemContext = createContext(null);

export function SiemProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const fetchAlerts = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams({ limit: 50, ...filters });
      const res = await fetch(`${API_BASE}/api/alerts?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchAlerts()]);
    setLastRefresh(new Date());
    setLoading(false);
  }, [fetchStats, fetchAlerts]);

  const updateAlertStatus = useCallback(async (alertId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchAlerts();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }, [fetchAlerts]);

  const triggerAiAnalysis = useCallback(async (alertId) => {
    const res = await fetch(`${API_BASE}/api/alerts/${alertId}/analyze`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, []);

  const ingestLog = useCallback(async (logData) => {
    const res = await fetch(`${API_BASE}/api/logs/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, []);

  // Initial load + auto-refresh every 30 seconds
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <SiemContext.Provider value={{
      stats, alerts, loading, error, lastRefresh,
      refresh, fetchAlerts, updateAlertStatus,
      triggerAiAnalysis, ingestLog,
      apiBase: API_BASE,
    }}>
      {children}
    </SiemContext.Provider>
  );
}

export function useSiem() {
  const ctx = useContext(SiemContext);
  if (!ctx) throw new Error("useSiem must be used inside SiemProvider");
  return ctx;
}
