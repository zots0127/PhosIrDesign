import type {
  OverviewPayload,
  RecordsPayload,
  TestPredictionRecord,
  TrainingRecord,
  ViewerData,
  VirtualPredictionRecord,
  VirtualSummaryPayload,
} from "../types/data";
import { assetPath } from "./assets";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(assetPath(path));
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export async function loadViewerData(): Promise<ViewerData> {
  const [overview, training, test, virtualRecords, virtualSummary] = await Promise.all([
    fetchJson<OverviewPayload>("data/overview.json"),
    fetchJson<RecordsPayload<TrainingRecord>>("data/training_data.json"),
    fetchJson<RecordsPayload<TestPredictionRecord>>("data/test_predictions_xgboost.json"),
    fetchJson<RecordsPayload<VirtualPredictionRecord>>("data/virtual_predictions_top5000.json"),
    fetchJson<VirtualSummaryPayload>("data/virtual_predictions_summary.json"),
  ]);

  return {
    overview,
    training: training.records,
    test: test.records,
    virtual: virtualRecords.records,
    virtualSummary,
  };
}
