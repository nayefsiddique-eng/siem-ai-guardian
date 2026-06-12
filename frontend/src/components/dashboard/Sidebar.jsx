import { useSiem } from "../../hooks/useSiem";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⬡" },
  { id: "alerts",    label: "Alerts",    icon: "◈" },
  { id: "logs",      label: "Logs",      icon: "≡" },
  { id: "analysis",  label: "AI Analysis", icon: "✦" },
];

export default function Sidebar({ activeView, setActiveView }) {
  const { stats, loading, lastRefresh, refresh } = useSiem();
  const openAlerts = stats?.overview?.open_alerts || 0;
  const criticalAlerts = stats?.overview?.critical_alerts_24h  0;

  return (
    <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 text-xl">◈</span>
          <div>
            <div className="text-xs font-bold text-cyan-400 tracking-widest uppercase">SIEM</div>
            <div className="text-gray-500 text-xs">AI Guardian</div>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-400">System Active</span>
        </div>
        {criticalAlerts > 0 && (
          <div className="mt-1 text-xs text-red-400">
            ⚠ {criticalAlerts} critical in 24h
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
              activeView === item.id
                ? "bg-cyan-950 text-cyan-400 border-r-2 border-cyan-400"
                : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
            {item.id === "alerts" && openAlerts > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                {openAlerts > 99 ? "99+" : openAlerts}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Refresh */}
      <div className="px-4 py-4 border-t border-gray-800">
        <button
          onClick={refresh}
          disabled={loading}
          className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
        >
          {loading ? "Refreshing..." : `↺ Refresh`}
        </button>
        {lastRefresh && (
          <div className="text-xs text-gray-700 mt-1 text-center">
            {lastRefresh.toLocaleTimeString()}
          </div>
        )}
      </div>
    </aside>
  );
}












