import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SiemContext = createContext(null);

export function SiemProvider({ children }) {
  const [stats,   setStats]   = useState(null);
  const [alerts,  setAlerts]  = useState([]);
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("siem_token") || null);
  const [user,  setUser]  = useState(null);

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/stats`, { headers: authHeaders() });
      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || JSON.stringify(err));
        }
      setStats(await res.json());
      setError(null);
    } catch (e) { setError(e.message); }
  }, [authHeaders]);

  const fetchAlerts = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams({ limit: 50, ...filters });
      const res = await fetch(`${API_BASE}/api/alerts?${params}`, { headers: authHeaders() });
      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || JSON.stringify(err));
        }
      const data = await res.json();
      setAlerts(data.alerts || data || []);
    } catch (e) { setError(e.message); }
  }, [authHeaders]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/logs`, { headers: authHeaders() });
      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || JSON.stringify(err));
        }
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : data.logs || []);
    } catch (e) { setError(e.message); }
  }, [authHeaders]);

  const ingestLog = useCallback(async (logData) => {
    const res = await fetch(`${API_BASE}/api/logs/ingest`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify(logData),
    });
    if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || JSON.stringify(err));
        }
    return res.json();
  }, [authHeaders]);

  const analyzeAlert = useCallback(async (alertId) => {
    const res = await fetch(`${API_BASE}/api/alerts/${alertId}/analyze`, {
      method: "POST", headers: authHeaders(),
    });
    if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || JSON.stringify(err));
        }
    const data = await res.json();
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, ...data } : a));
    return data;
  }, [authHeaders]);

  const updateAlertStatus = useCallback(async (alertId, status) => {
    try {
      await fetch(`${API_BASE}/api/alerts/${alertId}`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status } : a));
    } catch (e) { setError(e.message); }
  }, [authHeaders]);

  const freeformQuery = useCallback(async (query) => {
    try {
      const res = await fetch(`${API_BASE}/api/analysis/freeform`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ context: query }),
      });
      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || JSON.stringify(err));
        }
      const data = await res.json();
      return data.response || data.result || data;
    } catch (e) {
      throw new Error(e.message);
    }
  }, [authHeaders]);

  const generatePlaybook = useCallback(async (alertId) => {
    const res = await fetch(`${API_BASE}/api/playbooks/${alertId}/generate`, {
      method: "POST", headers: authHeaders(),
    });
    if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || JSON.stringify(err));
        }
    return res.json();
  }, [authHeaders]);

  const approvePlaybook = useCallback(async (alertId) => {
    const res = await fetch(`${API_BASE}/api/playbooks/${alertId}/approve`, {
      method: "POST", headers: authHeaders(),
    });
    if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || JSON.stringify(err));
        }
    return res.json();
  }, [authHeaders]);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("siem_token", data.access_token);
    return data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("siem_token");
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchAlerts()]);
    setLastRefresh(new Date());
    setLoading(false);
  }, [fetchStats, fetchAlerts]);

  useEffect(() => {
    refresh();
    // // const interval = setInterval(refresh, 30000);
    // // return () => clearInterval(interval);
  }, [refresh]);

  return (
    <SiemContext.Provider value={{
      stats, alerts, logs, loading, error, lastRefresh, token, user,
      login, logout, refresh,
      fetchStats, fetchAlerts, fetchLogs,
      ingestLog, analyzeAlert, updateAlertStatus,
      freeformQuery, generatePlaybook, approvePlaybook,
      apiBase: API_BASE, authHeaders,
    }}>
      {children}
    </SiemContext.Provider>
  );
}

export function useSiem() {
  const ctx = useContext(SiemContext);
  if (!ctx) throw new Error("useSiem must be inside SiemProvider");
  return ctx;
}






