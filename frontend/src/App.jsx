import { useState, useEffect } from "react";
import Sidebar from "./components/dashboard/Sidebar";
import DashboardHome from "./components/dashboard/DashboardHome";
import AlertsView from "./components/alerts/AlertsView";
import LogsView from "./components/logs/LogsView";
import AnalysisView from "./components/analysis/AnalysisView";
import { SiemProvider } from "./hooks/useSiem";

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");

  return (
    <SiemProvider>
      <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-mono">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-1 overflow-auto">
          {activeView === "dashboard" && <DashboardHome />}
          {activeView === "alerts" && <AlertsView />}
          {activeView === "logs" && <LogsView />}
          {activeView === "analysis" && <AnalysisView />}
        </main>
      </div>
    </SiemProvider>
  );
}
