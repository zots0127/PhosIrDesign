import type {
  TestPredictionRecord,
  TrainingRecord,
  VirtualPredictionRecord,
} from "../types/data";
import { buildSearchBlob } from "./normalize";

export interface TrainingFilters {
  query: string;
  solvent: string;
}

export interface VirtualFilters {
  query: string;
  minPlqy: number;
  wavelengthMin: number;
  wavelengthMax: number;
}

function matchesQuery(searchBlob: string, query: string): boolean {
  if (!query.trim()) {
    return true;
  }
  return searchBlob.includes(query.trim().toLowerCase());
}

export function filterTrainingRecords(records: TrainingRecord[], filters: TrainingFilters): TrainingRecord[] {
  return records.filter((record) => {
    const solventMatch = filters.solvent === "All" || record.solvent === filters.solvent;
    return solventMatch && matchesQuery(buildSearchBlob(record), filters.query);
  });
}

export function filterTestRecords(records: TestPredictionRecord[], query: string): TestPredictionRecord[] {
  return records.filter((record) => matchesQuery(buildSearchBlob(record), query));
}

export function filterVirtualRecords(records: VirtualPredictionRecord[], filters: VirtualFilters): VirtualPredictionRecord[] {
  return records.filter((record) => {
    const predictedPlqy = record.predictedPlqy ?? Number.NEGATIVE_INFINITY;
    const predictedWavelength = record.predictedMaxWavelengthNm ?? Number.NEGATIVE_INFINITY;
    return (
      predictedPlqy >= filters.minPlqy &&
      predictedWavelength >= filters.wavelengthMin &&
      predictedWavelength <= filters.wavelengthMax &&
      matchesQuery(buildSearchBlob(record), filters.query)
    );
  });
}
