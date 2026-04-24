import type { PropsWithChildren } from "react";
import type { PageKey, SelectableRecord } from "../types/data";
import { MoleculeDetailPanel } from "./MoleculeDetailPanel";

const PAGE_OPTIONS: Array<{ key: PageKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "dataset", label: "Dataset" },
  { key: "test", label: "External test" },
  { key: "virtual", label: "Screening" },
  { key: "predictor", label: "Predictor" },
];

interface LayoutProps extends PropsWithChildren {
  activePage: PageKey;
  onPageChange: (page: PageKey) => void;
  selectedRecord: SelectableRecord | null;
  onClearSelection: () => void;
}

export function Layout({
  activePage,
  onPageChange,
  selectedRecord,
  onClearSelection,
  children,
}: LayoutProps) {
  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="header-topline">
          <p className="eyebrow">Static research viewer</p>
          <div className="header-links" aria-label="Repository links">
            <a href="https://github.com/zots0127/PhosIrDesign">GitHub</a>
            <a href="https://colab.research.google.com/github/zots0127/PhosIrDesign/blob/main/notebooks/run_in_colab.ipynb">
              Colab
            </a>
          </div>
        </div>
        <div className="header-layout">
          <div className="header-copy">
            <h1>PhosIrDesign research viewer</h1>
            <p className="header-summary">
              Browse the curated Ir(III) emitter dataset, the xgboost post-screening test export, and a focus subset of
              the virtual-screening library directly in the browser.
            </p>
          </div>
          <nav className="page-nav" aria-label="Viewer sections">
            {PAGE_OPTIONS.map((page) => (
              <button
                key={page.key}
                className={page.key === activePage ? "nav-pill active" : "nav-pill"}
                type="button"
                onClick={() => onPageChange(page.key)}
              >
                {page.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <div className="content-grid">
        <main className="content-column">{children}</main>
        <aside className="detail-column">
          <MoleculeDetailPanel record={selectedRecord} onClear={onClearSelection} />
        </aside>
      </div>
    </div>
  );
}
