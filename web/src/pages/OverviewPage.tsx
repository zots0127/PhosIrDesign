import { MetricCard } from "../components/MetricCard";
import { SectionIntro } from "../components/SectionIntro";
import { assetPath } from "../lib/assets";
import { computeOverviewCards } from "../lib/normalize";
import type { OverviewPayload, PageKey, TestPredictionRecord, VirtualSummaryPayload } from "../types/data";

interface OverviewPageProps {
  overview: OverviewPayload;
  virtualSummary: VirtualSummaryPayload;
  testRecords: TestPredictionRecord[];
  onNavigate: (page: PageKey) => void;
}

const WORKFLOW_STEPS = [
  ["Manual curation", "Literature records are normalized into ligand-level Ir(III) emitter data."],
  ["Model benchmark", "Multiple regressors are trained and compared with cross-validation."],
  ["Experimental check", "Post-screening synthesized emitters are predicted from the shipped model exports."],
  ["Closed loop", "Screened candidates are intended for synthesis, measurement, and dataset update."],
] as const;

export function OverviewPage({ overview, virtualSummary, testRecords, onNavigate }: OverviewPageProps) {
  const cards = computeOverviewCards(overview, virtualSummary);

  return (
    <div className="page-stack">
      <section className="hero-card hero-card-prominent">
        <div className="hero-text">
          <p className="eyebrow">Repository scope</p>
          <h2>Closed-loop molecular design assets, inspectable in the browser</h2>
          <p>
            This static viewer packages the curated Ir(III) training set, the shipped xgboost post-screening test
            export, and a browser-friendly focus subset of the virtual-screening results used to prioritize
            experimental follow-up.
          </p>
          <div className="hero-actions" aria-label="Primary viewer actions">
            <button type="button" className="action-button primary" onClick={() => onNavigate("dataset")}>
              Inspect dataset
            </button>
            <button type="button" className="action-button" onClick={() => onNavigate("test")}>
              Check test export
            </button>
            <button type="button" className="action-button" onClick={() => onNavigate("virtual")}>
              Browse screening
            </button>
            <button type="button" className="action-button" onClick={() => onNavigate("predictor")}>
              Run predictor
            </button>
          </div>
        </div>
        <img
          className="hero-image"
          src={assetPath("images/pipeline_figure.png")}
          alt="Closed-loop pipeline overview showing manual literature curation, molecular features, model benchmarking, virtual screening, synthesis, measurement, and feedback into the dataset."
        />
      </section>

      <div className="metrics-grid">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <section className="panel-card">
        <SectionIntro
          eyebrow="Closed-loop logic"
          title="From manually curated data to experimental feedback"
          description="The viewer is organized around the scientific loop, not just around generated files."
        />
        <div className="workflow-strip">
          {WORKFLOW_STEPS.map(([title, description], index) => (
            <article key={title} className="workflow-step">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <SectionIntro
          eyebrow="Reproducibility map"
          title="What first-time readers can verify"
          description="The browser bundle keeps the key computational artifacts small enough for GitHub Pages while preserving direct links back to the repository workflow."
        />
        <div className="bullet-grid">
          <article>
            <h3>Training data</h3>
            <p>{overview.stats.training_count.toLocaleString()} manually curated records from `data/PhosIrDB.csv`.</p>
          </article>
          <article>
            <h3>External test export</h3>
            <p>{testRecords.map((record) => record.displayName).join(", ")} with actual and predicted targets.</p>
          </article>
          <article>
            <h3>Virtual screening</h3>
            <p>
              {overview.stats.virtual_total_count.toLocaleString()} total candidates, with a {overview.stats.virtual_focus_count.toLocaleString()}-record focus subset for the browser.
            </p>
          </article>
        </div>
        <div className="command-grid">
          <article>
            <span>Reproduce locally</span>
            <code>bash run.sh</code>
          </article>
          <article>
            <span>Open the output directory</span>
            <code>Project_Output_YYYYMMDD_HHMMSS</code>
          </article>
          <article>
            <span>Refresh Pages data</span>
            <code>python scripts/export_pages_data.py --output assets/data</code>
          </article>
        </div>
      </section>

      <section className="panel-card">
        <SectionIntro
          eyebrow="Representative outputs"
          title="Publication-style figures included in the repository"
          description="These figure exports remain in the Python output tree. The viewer highlights them here to orient first-time readers before they inspect the raw tables."
        />
        <div className="image-grid">
          <figure>
            <img src={assetPath("images/figure_c_wavelength_plqy.png")} alt="Model performance figure showing wavelength and PLQY distributions." />
            <figcaption>Model-comparison and distribution overview from the publication figure export.</figcaption>
          </figure>
          <figure>
            <img src={assetPath("images/figure_i_ligand_analysis.png")} alt="Ligand analysis figure used in the publication output." />
            <figcaption>Ligand-level analysis output used to interpret the screening results.</figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
}
