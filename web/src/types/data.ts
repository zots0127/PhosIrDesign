export type PageKey = "overview" | "dataset" | "test" | "virtual" | "predictor";

export interface OverviewStats {
  training_count: number;
  test_count: number;
  virtual_total_count: number;
  virtual_focus_count: number;
  representative_labels: string[];
  solvent_counts: Record<string, number>;
  wavelength_range_nm: {
    min: number;
    max: number;
  };
  plqy_range: {
    min: number;
    max: number;
  };
  virtual_threshold_counts: Record<string, number>;
}

export interface OverviewPayload {
  generatedAt: string;
  sources: Record<string, string>;
  stats: OverviewStats;
}

export interface LigandRecord {
  l1: string | null;
  l2: string | null;
  l3: string | null;
}

export interface TrainingRecord extends LigandRecord {
  id: string;
  rowIndex: number;
  label: string | null;
  counterion: string | null;
  charge: number | null;
  maxWavelengthNm: number | null;
  plqy: number | null;
  lifetimeUs: number | null;
  solvent: string | null;
  doi: string | null;
  notes: string | null;
  source: "training";
}

export interface TestPredictionRecord extends LigandRecord {
  id: string;
  displayName: string;
  articleLabel: string | null;
  actualMaxWavelengthNm: number | null;
  predictedMaxWavelengthNm: number | null;
  actualPlqy: number | null;
  predictedPlqy: number | null;
  wavelengthErrorNm: number | null;
  plqyError: number | null;
  roundedPrediction: {
    maxWavelengthNm: number | null;
    plqy: number | null;
  };
  source: "xgboost_test_export";
}

export interface VirtualPredictionRecord extends LigandRecord {
  id: string;
  rank: number;
  predictedMaxWavelengthNm: number | null;
  predictedPlqy: number | null;
  combinedScore: number | null;
  source: "virtual_focus";
}

export interface VirtualSummaryPayload {
  generatedAt: string;
  selectionNote: string;
  topPredictedPlqy: number | null;
  topPredictedWavelengthNm: number | null;
  thresholdCountsInFullSet: Record<string, number>;
}

export interface RecordsPayload<T> {
  generatedAt: string;
  records: T[];
}

export type SelectableRecord =
  | TrainingRecord
  | TestPredictionRecord
  | VirtualPredictionRecord;

export interface ViewerData {
  overview: OverviewPayload;
  training: TrainingRecord[];
  test: TestPredictionRecord[];
  virtual: VirtualPredictionRecord[];
  virtualSummary: VirtualSummaryPayload;
}
