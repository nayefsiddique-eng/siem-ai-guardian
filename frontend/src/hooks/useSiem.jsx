import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SiemContext = createContext(null);

export function SiemProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("siem_token") || null);
  const [user, setUser] = useState(null);

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/stats`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats(await res.json());
      setError(null);
    } catch (e) { setError(e.message); }
  }, [authHeaders]);

  const fetchAlerts = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams({ limit: 50, ...filters });
      const res = await fetch(`${API_BASE}/api/alerts?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) { setError(e.message); }
  }, [authHeaders]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchAlerts()]);
    setLastRefresh(new Date());
    setLoading(false);
  }, [fetchStats, fetchAlerts]);

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

  const updateAlertStatus = useCallback(async (alertId, status) => {
    try {
      await fetch(`${API_BASE}/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      await fetchAlerts();
    } catch (e) { setError(e.message); }
  }, [authHeaders, fetchAlerts]);

  const triggerAiAnalysis = useCallback(async (alertId) => {
    const res = await fetch(`${API_BASE}/api/alerts/${alertId}/analyze`, {
      method: "POST", headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [authHeaders]);

  const generatePlaybook = useCallback(async (alertId) => {
    const res = await fetch(`${API_BASE}/api/playbooks/${alertId}/generate`, {
      method: "POST", headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [authHeaders]);

  const approvePlaybook = useCallback(async (alertId) => {
    const res = await fetch(`${API_BASE}/api/playbooks/${alertId}/approve`, {
      method: "POST", headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [authHeaders]);

  const getCompliance = useCallback(async (alertId) => {
    const res = await fetch(`${API_BASE}/api/compliance/${alertId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [authHeaders]);

  const ingestLog = useCallback(async (logData) => {
    const res = await fetch(`${API_BASE}/api/logs/ingest`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify(logData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [authHeaders]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <SiemContext.Provider value={{
      stats, alerts, loading, error, lastRefresh, token, user,
      login, logout, refresh, fetchAlerts, updateAlertStatus,
      triggerAiAnalysis, generatePlaybook, approvePlaybook,
      getCompliance, ingestLog, apiBase: API_BASE, authHeaders,
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
S