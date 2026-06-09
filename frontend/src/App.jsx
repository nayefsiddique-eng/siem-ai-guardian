import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import DashboardHome from "./components/dashboard/DashboardHome";
import AlertsView from "./components/alerts/AlertsView";
import LogsView from "./components/logs/LogsView";
import AnalysisView from "./components/analysis/AnalysisView";
import { SiemProvider } from "./hooks/useSiem";

export default function App() {
  const [view, setView] = useState("dashboard");

  const views = {
    dashboard: <DashboardHome />,
    alerts:    <AlertsView />,
    logs:      <LogsView />,
    analysis:  <AnalysisView />,
  };

  return (
    <SiemProvider>
      <div className="scanline-overlay" />
      <div style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-base)",
      }}>
        <Sidebar activeView={view} onNavigate={setView} />
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}>
          <Topbar activeView={view} />
          <main style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            background: "var(--bg-base)",
          }}>
            <div className="fade-in" key={view}>
              {views[view]}
            </div>
          </main>
        </div>
      </div>
    </SiemProvider>
  );
}
