import type {
  OverviewPayload,
  SelectableRecord,
  TestPredictionRecord,
  TrainingRecord,
  VirtualPredictionRecord,
  VirtualSummaryPayload,
} from "../types/data";

export interface MetricCardValue {
  label: string;
  value: string;
  helper: string;
}

export function buildMoleculeTitle(record: SelectableRecord): string {
  if ("displayName" in record) {
    return record.displayName;
  }
  if ("label" in record && record.label) {
    return record.label;
  }
  if ("rank" in record) {
    return `Virtual candidate #${record.rank}`;
  }
  return record.id;
}

export function buildSearchBlob(record: Partial<SelectableRecord>): string {
  const values: Array<string | number | null | undefined> = [
    "displayName" in record ? record.displayName : undefined,
    "articleLabel" in record ? record.articleLabel : undefined,
    "label" in record ? record.label : undefined,
    record.id,
    record.l1,
    record.l2,
    record.l3,
  ];
  return values
    .filter((value): value is string | number => value !== null && value !== undefined)
    .join(" ")
    .toLowerCase();
}

export function sortSolvents(records: TrainingRecord[]): string[] {
  return Array.from(new Set(records.map((record) => record.solvent).filter(Boolean) as string[])).sort((left, right) =>
    left.localeCompare(right),
  );
}

export function computeOverviewCards(
  overview: OverviewPayload,
  virtualSummary: VirtualSummaryPayload,
): MetricCardValue[] {
  return [
    {
      label: "Curated training set",
      value: overview.stats.training_count.toLocaleString(),
      helper: `Emission range ${overview.stats.wavelength_range_nm.min.toFixed(0)}-${overview.stats.wavelength_range_nm.max.toFixed(0)} nm`,
    },
    {
      label: "External test molecules",
      value: overview.stats.test_count.toString(),
      helper: `Representative set: ${overview.stats.representative_labels.join(", ")}`,
    },
    {
      label: "Virtual screening library",
      value: overview.stats.virtual_total_count.toLocaleString(),
      helper: `${overview.stats.virtual_focus_count.toLocaleString()} records shipped to the web viewer`,
    },
    {
      label: "High-PLQY candidates",
      value: overview.stats.virtual_threshold_counts["plqy>=0.80"].toLocaleString(),
      helper: `Top focus set reaches ${formatNumber(virtualSummary.topPredictedPlqy, 3)} predicted PLQY`,
    },
  ];
}

export function computeTestSummary(records: TestPredictionRecord[]): MetricCardValue[] {
  const validWavelengthErrors = records
    .map((record) => Math.abs(record.wavelengthErrorNm ?? Number.NaN))
    .filter((value) => Number.isFinite(value));
  const validPlqyErrors = records
    .map((record) => Math.abs(record.plqyError ?? Number.NaN))
    .filter((value) => Number.isFinite(value));

  const maeWavelength = average(validWavelengthErrors);
  const maePlqy = average(validPlqyErrors);
  const bestPredictedPlqy = records.reduce(
    (best, record) => (record.predictedPlqy ?? -Infinity) > (best.predictedPlqy ?? -Infinity) ? record : best,
    records[0],
  );

  return [
    {
      label: "Wavelength MAE",
      value: `${formatNumber(maeWavelength, 1)} nm`,
      helper: "Absolute error vs. shipped xgboost test export",
    },
    {
      label: "PLQY MAE",
      value: formatNumber(maePlqy, 3),
      helper: "Absolute error for post-screening synthesized emitters",
    },
    {
      label: "Top predicted PLQY",
      value: `${bestPredictedPlqy.displayName} - ${formatNumber(bestPredictedPlqy.predictedPlqy, 3)}`,
      helper: `Rounded value ${formatNumber(bestPredictedPlqy.roundedPrediction.plqy, 2)}`,
    },
  ];
}

export function computeVirtualSummary(records: VirtualPredictionRecord[]): MetricCardValue[] {
  const topCandidate = records[0];
  const longestWavelength = records.reduce(
    (best, record) =>
      (record.predictedMaxWavelengthNm ?? -Infinity) > (best.predictedMaxWavelengthNm ?? -Infinity) ? record : best,
    records[0],
  );

  return [
    {
      label: "Viewer subset",
      value: records.length.toLocaleString(),
      helper: "All entries with predicted PLQY >= 0.70 plus the next highest-ranked records",
    },
    {
      label: "Top predicted PLQY",
      value: formatNumber(topCandidate.predictedPlqy, 3),
      helper: `Candidate #${topCandidate.rank}`,
    },
    {
      label: "Longest predicted emission",
      value: `${formatNumber(longestWavelength.predictedMaxWavelengthNm, 1)} nm`,
      helper: `Candidate #${longestWavelength.rank}`,
    },
  ];
}

export function collectLigands(record: SelectableRecord): Array<{ label: "L1" | "L2" | "L3"; smiles: string }> {
  const ligands: Array<{ label: "L1" | "L2" | "L3"; smiles: string | null }> = [
    { label: "L1", smiles: record.l1 },
    { label: "L2", smiles: record.l2 },
    { label: "L3", smiles: record.l3 },
  ];
  return ligands.filter((ligand): ligand is { label: "L1" | "L2" | "L3"; smiles: string } => Boolean(ligand.smiles));
}

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "N/A";
  }
  return value.toFixed(digits);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return Number.NaN;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
