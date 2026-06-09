import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useSiem } from "../../hooks/useSiem";

const SEVERITY_COLORS = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#22c55e",
};

const ALERT_TYPE_COLORS = ["#06b6d4", "#8b5cf6", "#f97316", "#ec4899", "#22c55e"];

function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className={`rounded-lg border p-4 ${accent
      ? "bg-red-950/40 border-red-800/50"
      : "bg-gray-900 border-gray-800"
    }`}>
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-3xl font-bold tabular-nums ${accent ? "text-red-400" : "text-gray-100"}`}>
        {value ?? "—"}
      </div>
      {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
    </div>
  );
}

function SeverityBadge({ severity }) {
  const colors = {
    critical: "bg-red-900/50 text-red-400 border border-red-800",
    high:     "bg-orange-900/50 text-orange-400 border border-orange-800",
    medium:   "bg-yellow-900/50 text-yellow-400 border border-yellow-800",
    low:      "bg-green-900/50 text-green-400 border border-green-800",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-mono uppercase ${colors[severity] || "bg-gray-800 text-gray-400"}`}>
      {severity}
    </span>
  );
}

export default function DashboardHome() {
  const { stats, loading, error } = useSiem();

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-2xl mb-2">◈</div>
          <div className="text-sm">Loading SIEM data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-400">
          <div className="text-2xl mb-2">⚠</div>
          <div className="text-sm">Backend unreachable: {error}</div>
          <div className="text-xs text-gray-600 mt-2">Make sure the FastAPI server is running on port 8000</div>
        </div>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const timeline = stats?.alerts_timeline || [];
  const topIps = stats?.top_attacker_ips || [];
  const recentAlerts = stats?.recent_alerts || [];
  const alertTypes = Object.entries(stats?.alerts_by_type || {}).map(([name, value]) => ({ name, value }));
  const severityData = Object.entries(stats?.alerts_by_severity || {}).map(([name, value]) => ({
    name, value, fill: SEVERITY_COLORS[name] || "#6b7280"
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100 tracking-tight">Security Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">AI-Powered SIEM — Real-time threat monitoring</p>
        </div>
        <div className="text-xs text-gray-600 font-mono">
          {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Alerts" value={overview.open_alerts} sub="requiring attention" accent={overview.open_alerts > 0} />
        <StatCard label="Critical (24h)" value={overview.critical_alerts_24h} sub="high + critical severity" accent={overview.critical_alerts_24h > 0} />
        <StatCard label="Logs (24h)" value={overview.logs_last_24h?.toLocaleString()} sub={`${overview.total_logs?.toLocaleString()} total`} />
        <StatCard label="Total Alerts" value={overview.total_alerts} sub="all time" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Alert Timeline (7 Days)</div>
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "6px" }}
                  labelStyle={{ color: "#9ca3af" }}
                  itemStyle={{ color: "#06b6d4" }}
                />
                <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-gray-700 text-sm">No alert data yet</div>
          )}
        </div>

        {/* Severity pie */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Severity Distribution</div>
          {severityData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={severityData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                    {severityData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "6px" }}
                    itemStyle={{ color: "#9ca3af" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {severityData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                      <span className="text-gray-400 capitalize">{d.name}</span>
                    </div>
                    <span className="text-gray-300 tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[140px] text-gray-700 text-sm">No alerts yet</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top attacker IPs */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Top Attacker IPs (24h)</div>
          {topIps.length > 0 ? (
            <div className="space-y-2">
              {topIps.slice(0, 8).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-gray-700 text-xs tabular-nums w-4">{i + 1}</span>
                  <span className="text-cyan-400 font-mono text-xs flex-1">{item.ip}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-cyan-600 rounded-full"
                      style={{ width: `${(item.count / topIps[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-xs tabular-nums w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-700 text-sm text-center py-8">No log data yet</div>
          )}
        </div>

        {/* Recent alerts */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Recent Alerts</div>
          {recentAlerts.length > 0 ? (
            <div className="space-y-2">
              {recentAlerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0">
                  <SeverityBadge severity={alert.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-200 truncate">{alert.title}</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {alert.mitre_technique_id && (
                        <span className="text-purple-500">{alert.mitre_technique_id} · </span>
                      )}
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className={`text-xs ${alert.status === "open" ? "text-red-400" : "text-gray-600"}`}>
                    {alert.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-700 text-sm text-center py-8">No alerts generated yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
