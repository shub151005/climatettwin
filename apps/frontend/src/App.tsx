import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/layout/AppShell";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import DataSourcesPage from "./pages/data-sources/DataSourcesPage";
import HistoryPage from "./pages/history/HistoryPage";
import LivePage from "./pages/live/LivePage";
import ScenarioLabPage from "./pages/scenario-lab/ScenarioLabPage";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/live" replace />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/scenario-lab" element={<ScenarioLabPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/data-sources" element={<DataSourcesPage />} />
        <Route path="*" element={<Navigate to="/live" replace />} />
      </Routes>
    </AppShell>
  );
}

export default App;