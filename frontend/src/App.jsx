import { useState } from "react";
import Layout from "./components/layout/Layout";
import OverviewView from "./components/overview/OverviewView";
import AlertsView from "./components/alerts/AlertsView";
import LogsView from "./components/logs/LogsView";
import { QueryPanel, PlaybookPanel } from "./components/analysis/AnalysisView";
import { SiemProvider } from "./hooks/useSiem";

export default function App() {
  const [view, setView] = useState("overview");

  const views = {
    overview: <OverviewView />,
    alerts:   <AlertsView />,
    logs:     <LogsView />,
    analysis: <QueryPanel />,
    playbook: <PlaybookPanel />,
  };

  return (
    <SiemProvider>
      <Layout active={view} onNavigate={setView}>
        <div key={view}>{views[view]}</div>
      </Layout>
    </SiemProvider>
  );
}
