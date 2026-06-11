import { useState } from "react";
import Layout from "./components/layout/Layout";
import OverviewView from "./components/overview/OverviewView";
import AlertsView from "./components/alerts/AlertsView";
import LogsView from "./components/logs/LogsView";
import AnalysisView from "./components/analysis/AnalysisView";
import ComplianceView from "./components/compliance/ComplianceView";
import ReportsView from "./components/reports/ReportsView";
import PlaybookView from "./components/playbook/PlaybookView";
import { SiemProvider } from "./hooks/useSiem";
import SentinalAIView from "./components/SentinalAI/SentinalAIView";
export default function App() {
 const [view, setView] = useState("overview");

const views = {
  overview: <OverviewView />,
  alerts: <AlertsView />,
  logs: <LogsView />,
  analysis: <AnalysisView />,
  sentinalai: <SentinalAIView />,
  playbook: <PlaybookView />,
  reports: <ReportsView />,
  compliance: <ComplianceView />,
};

  return (
    <SiemProvider>
      <Layout active={view} onNavigate={setView}>
        <div key={view}>
          {views[view]}
        </div>
      </Layout>
    </SiemProvider>
  );
}









