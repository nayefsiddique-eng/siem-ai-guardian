import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import OverviewView from "./components/overview/OverviewView";
import AlertsView from "./components/alerts/AlertsView";
import LogsView from "./components/logs/LogsView";
import AnalysisView from "./components/analysis/AnalysisView";
import { SiemProvider } from "./hooks/useSiem";

export default function App() {
  const [view, setView] = useState("overview");

  const views = {
    overview:  <OverviewView />,
    alerts:    <AlertsView />,
    logs:      <LogsView />,
    analysis:  <AnalysisView mode="query" />,
    playbook:  <AnalysisView mode="playbook" />,
  };

  return (
    <SiemProvider>
      <div style={{
        display: "flex", height: "100vh",
        overflow: "hidden", background: "var(--bg-base)",
      }}>
        <Sidebar activeView={view} onNavigate={setView} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <Topbar activeView={view} />
          <main style={{ flex: 1, overflowY: "auto", padding: "24px", background: "var(--bg-base)" }}>
            <div key={view}>{views[view]}</div>
          </main>
        </div>
      </div>
    </SiemProvider>
  );
}

