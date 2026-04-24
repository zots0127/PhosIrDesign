import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { loadViewerData } from "./lib/loaders";
import type { PageKey, SelectableRecord, ViewerData } from "./types/data";
import { OverviewPage } from "./pages/OverviewPage";
import { DatasetExplorerPage } from "./pages/DatasetExplorerPage";
import { PredictorPage } from "./pages/PredictorPage";
import { TestSetExplorerPage } from "./pages/TestSetExplorerPage";
import { VirtualScreeningPage } from "./pages/VirtualScreeningPage";

const PAGE_KEYS: PageKey[] = ["overview", "dataset", "test", "virtual", "predictor"];

function getInitialPage(): PageKey {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return PAGE_KEYS.includes(hash as PageKey) ? (hash as PageKey) : "overview";
}

export default function App() {
  const [viewerData, setViewerData] = useState<ViewerData | null>(null);
  const [activePage, setActivePage] = useState<PageKey>(() => getInitialPage());
  const [selectedRecord, setSelectedRecord] = useState<SelectableRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadViewerData()
      .then((data) => {
        setViewerData(data);
        setSelectedRecord(data.test[0] ?? data.training[0] ?? null);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load viewer data.");
      });
  }, []);

  const handlePageChange = (page: PageKey) => {
    setActivePage(page);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${page}`);
  };

  if (error) {
    return (
      <main className="app-shell">
        <section className="hero-card">
          <p className="eyebrow">Viewer error</p>
          <h1>Unable to load the static data bundle</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!viewerData) {
    return (
      <main className="app-shell">
        <section className="hero-card">
          <p className="eyebrow">Loading</p>
          <h1>Preparing the Pages data bundle</h1>
          <p>The app is fetching the exported JSON assets from `assets/data`.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Layout
        activePage={activePage}
        onPageChange={handlePageChange}
        selectedRecord={selectedRecord}
        onClearSelection={() => setSelectedRecord(null)}
      >
        {activePage === "overview" && (
          <OverviewPage
            overview={viewerData.overview}
            virtualSummary={viewerData.virtualSummary}
            testRecords={viewerData.test}
            onNavigate={handlePageChange}
          />
        )}
        {activePage === "dataset" && (
          <DatasetExplorerPage records={viewerData.training} onSelectRecord={setSelectedRecord} />
        )}
        {activePage === "test" && <TestSetExplorerPage records={viewerData.test} onSelectRecord={setSelectedRecord} />}
        {activePage === "virtual" && (
          <VirtualScreeningPage
            records={viewerData.virtual}
            summary={viewerData.virtualSummary}
            onSelectRecord={setSelectedRecord}
          />
        )}
        {activePage === "predictor" && <PredictorPage />}
      </Layout>
    </main>
  );
}
