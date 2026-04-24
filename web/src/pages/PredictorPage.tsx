import { useEffect, useMemo, useState } from "react";
import { MoleculeViewer } from "../components/MoleculeViewer";
import { SectionIntro } from "../components/SectionIntro";
import { formatNumber } from "../lib/normalize";

interface ApiLigand {
  smiles: string;
  roles: Record<"L1" | "L2" | "L3", number>;
}

interface ApiPrediction {
  modelFamily: "xgboost";
  featureType: "combined";
  combinationMethod: "mean";
  predictedMaxWavelengthNm: number;
  predictedPlqy: number;
}

const DEFAULT_API_URL = (import.meta.env.VITE_PREDICTOR_API_URL as string | undefined) ?? "";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

function roleSummary(ligand: ApiLigand | undefined): string {
  if (!ligand) {
    return "Select a known ligand from the repository vocabulary.";
  }
  return `L1 ${ligand.roles.L1} | L2 ${ligand.roles.L2} | L3 ${ligand.roles.L3}`;
}

export function PredictorPage() {
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem("phosirdesign-api-url") ?? DEFAULT_API_URL);
  const [ligands, setLigands] = useState<ApiLigand[]>([]);
  const [selected, setSelected] = useState({ l1: "", l2: "", l3: "" });
  const [prediction, setPrediction] = useState<ApiPrediction | null>(null);
  const [loadingLigands, setLoadingLigands] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ligandMap = useMemo(() => new Map(ligands.map((ligand) => [ligand.smiles, ligand])), [ligands]);
  const canPredict = selected.l1 && selected.l2 && selected.l3 && ligandMap.has(selected.l1) && ligandMap.has(selected.l2) && ligandMap.has(selected.l3);
  const selectedLigands = [selected.l1, selected.l2, selected.l3].filter(Boolean);

  const connect = async () => {
    const baseUrl = trimTrailingSlash(apiUrl);
    if (!baseUrl) {
      setError("Set a predictor API URL first.");
      return;
    }

    setLoadingLigands(true);
    setError(null);
    try {
      const payload = await fetchJson<ApiLigand[]>(`${baseUrl}/ligands`);
      setLigands(payload);
      localStorage.setItem("phosirdesign-api-url", baseUrl);
      setApiUrl(baseUrl);
      if (payload.length > 0 && !selected.l1) {
        const firstL1 = payload.find((ligand) => ligand.roles.L1 > 0) ?? payload[0];
        const firstL2 = payload.find((ligand) => ligand.roles.L2 > 0) ?? firstL1;
        const firstL3 = payload.find((ligand) => ligand.roles.L3 > 0) ?? firstL1;
        setSelected({ l1: firstL1.smiles, l2: firstL2.smiles, l3: firstL3.smiles });
      }
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Failed to connect to predictor API.");
    } finally {
      setLoadingLigands(false);
    }
  };

  useEffect(() => {
    if (DEFAULT_API_URL) {
      void connect();
    }
  }, []);

  const predict = async () => {
    const baseUrl = trimTrailingSlash(apiUrl);
    if (!canPredict) {
      setError("Select exact known ligand entries for L1, L2, and L3.");
      return;
    }

    setPredicting(true);
    setError(null);
    setPrediction(null);
    try {
      const result = await fetchJson<ApiPrediction>(`${baseUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });
      setPrediction(result);
    } catch (predictError) {
      setError(predictError instanceof Error ? predictError.message : "Prediction failed.");
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel-card predictor-panel">
        <SectionIntro
          eyebrow="Live predictor"
          title="Predict with the shipped Python XGBoost backend"
          description="The browser sends selected repository ligands to a FastAPI service that runs the original RDKit feature pipeline and trained XGBoost models."
        />

        <div className="api-connect-row">
          <label>
            Predictor API URL
            <input
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              placeholder="https://your-phosirdesign-api.example.com"
            />
          </label>
          <button type="button" className="action-button primary" onClick={connect} disabled={loadingLigands}>
            {loadingLigands ? "Connecting" : "Connect"}
          </button>
        </div>

        <div className="predictor-note">
          <strong>Backend mode:</strong> predictions use the Python RDKit feature extractor and joblib XGBoost models,
          so this path is the closest match to the repository workflow. For versioned online predictions, deploy the
          API with the `xgboost_models` bundle from the matching GitHub Release.
        </div>
      </section>

      <section className="panel-card">
        <SectionIntro
          eyebrow="Ligand selection"
          title="Search existing L1, L2, and L3 ligands"
          description={`${ligands.length.toLocaleString()} known ligands loaded from the API vocabulary.`}
        />

        <datalist id="known-ligands">
          {ligands.map((ligand) => (
            <option key={ligand.smiles} value={ligand.smiles}>
              {roleSummary(ligand)}
            </option>
          ))}
        </datalist>

        <div className="predictor-grid">
          {(["l1", "l2", "l3"] as const).map((key) => {
            const ligand = ligandMap.get(selected[key]);
            return (
              <label key={key}>
                {key.toUpperCase()}
                <input
                  list="known-ligands"
                  value={selected[key]}
                  onChange={(event) => setSelected((current) => ({ ...current, [key]: event.target.value }))}
                  placeholder={`Search ${key.toUpperCase()} SMILES`}
                />
                <span className={ligand ? "field-hint" : "field-hint warning"}>{roleSummary(ligand)}</span>
              </label>
            );
          })}
        </div>

        <div className="hero-actions">
          <button type="button" className="action-button primary" onClick={predict} disabled={!canPredict || predicting}>
            {predicting ? "Predicting" : "Predict PLQY and wavelength"}
          </button>
          {!canPredict && <span className="field-hint warning">All three fields must match known ligand entries.</span>}
        </div>

        {error && <div className="error-banner">{error}</div>}
      </section>

      {prediction && (
        <section className="panel-card prediction-results">
          <SectionIntro
            eyebrow="Prediction"
            title="Backend model output"
            description={`${prediction.modelFamily}, ${prediction.featureType} features, ${prediction.combinationMethod} ligand aggregation.`}
          />
          <div className="metrics-grid compact">
            <article className="metric-card">
              <span className="metric-label">Predicted emission</span>
              <strong className="metric-value">{formatNumber(prediction.predictedMaxWavelengthNm, 1)} nm</strong>
              <p className="metric-helper">Max_wavelength(nm)</p>
            </article>
            <article className="metric-card">
              <span className="metric-label">Predicted PLQY</span>
              <strong className="metric-value">{formatNumber(prediction.predictedPlqy, 3)}</strong>
              <p className="metric-helper">XGBoost PLQY model</p>
            </article>
            <article className="metric-card">
              <span className="metric-label">Rounded display</span>
              <strong className="metric-value">
                {Math.round(prediction.predictedMaxWavelengthNm)} nm / {formatNumber(prediction.predictedPlqy, 2)}
              </strong>
              <p className="metric-helper">Publication-style rounding</p>
            </article>
          </div>
        </section>
      )}

      {selectedLigands.length > 0 && (
        <section className="panel-card">
          <SectionIntro
            eyebrow="Selected structures"
            title="Ligands sent to the backend"
            description="The frontend only displays selected structures; RDKit feature extraction runs in Python."
          />
          <div className="predictor-molecule-grid">
            {(["l1", "l2", "l3"] as const).map((key) =>
              selected[key] ? <MoleculeViewer key={key} label={key.toUpperCase()} smiles={selected[key]} /> : null,
            )}
          </div>
        </section>
      )}
    </div>
  );
}
