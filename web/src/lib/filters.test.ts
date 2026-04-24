import { describe, expect, it } from "vitest";
import { filterTestRecords, filterTrainingRecords, filterVirtualRecords } from "./filters";
import type { TestPredictionRecord, TrainingRecord, VirtualPredictionRecord } from "../types/data";

const trainingRecords: TrainingRecord[] = [
  {
    id: "train-1",
    rowIndex: 1,
    label: "E1",
    l1: "Ligand-A",
    l2: "Ligand-B",
    l3: "Ligand-C",
    counterion: null,
    charge: 1,
    maxWavelengthNm: 598,
    plqy: 0.11,
    lifetimeUs: null,
    solvent: "CH2Cl2",
    doi: null,
    notes: null,
    source: "training",
  },
  {
    id: "train-2",
    rowIndex: 2,
    label: "E2",
    l1: "Ligand-X",
    l2: "Ligand-Y",
    l3: "Ligand-Z",
    counterion: null,
    charge: 1,
    maxWavelengthNm: 650,
    plqy: 0.42,
    lifetimeUs: null,
    solvent: "Toluene",
    doi: null,
    notes: null,
    source: "training",
  },
];

const testRecords: TestPredictionRecord[] = [
  {
    id: "Ir1",
    displayName: "Ir1",
    articleLabel: "Ir1",
    l1: "Ligand-A",
    l2: "Ligand-B",
    l3: "Ligand-C",
    actualMaxWavelengthNm: 574,
    predictedMaxWavelengthNm: 559.4,
    actualPlqy: 0.88,
    predictedPlqy: 0.82,
    wavelengthErrorNm: -14.6,
    plqyError: -0.06,
    roundedPrediction: { maxWavelengthNm: 559, plqy: 0.82 },
    source: "xgboost_test_export",
  },
  {
    id: "Ir1b",
    displayName: "Ir1b",
    articleLabel: "Ir1b",
    l1: "Ligand-Y",
    l2: "Ligand-Z",
    l3: "Ligand-W",
    actualMaxWavelengthNm: 530,
    predictedMaxWavelengthNm: 528.3,
    actualPlqy: 0.71,
    predictedPlqy: 0.82,
    wavelengthErrorNm: -1.7,
    plqyError: 0.11,
    roundedPrediction: { maxWavelengthNm: 528, plqy: 0.82 },
    source: "xgboost_test_export",
  },
];

const virtualRecords: VirtualPredictionRecord[] = [
  {
    id: "virtual-1",
    rank: 1,
    l1: "Ligand-A",
    l2: "Ligand-B",
    l3: "Ligand-C",
    predictedMaxWavelengthNm: 720,
    predictedPlqy: 0.84,
    combinedScore: 0.8,
    source: "virtual_focus",
  },
  {
    id: "virtual-2",
    rank: 2,
    l1: "Ligand-X",
    l2: "Ligand-Y",
    l3: "Ligand-Z",
    predictedMaxWavelengthNm: 540,
    predictedPlqy: 0.55,
    combinedScore: 0.6,
    source: "virtual_focus",
  },
];

describe("filter helpers", () => {
  it("filters training records by solvent and query", () => {
    const records = filterTrainingRecords(trainingRecords, {
      query: "Ligand-A",
      solvent: "CH2Cl2",
    });
    expect(records).toHaveLength(1);
    expect(records[0].label).toBe("E1");
  });

  it("filters test records by display name and ligand search", () => {
    expect(filterTestRecords(testRecords, "Ir1b")).toHaveLength(1);
    expect(filterTestRecords(testRecords, "Ligand-W")).toHaveLength(1);
  });

  it("filters virtual records by query, PLQY threshold, and wavelength window", () => {
    const records = filterVirtualRecords(virtualRecords, {
      query: "Ligand-A",
      minPlqy: 0.7,
      wavelengthMin: 650,
      wavelengthMax: 780,
    });
    expect(records).toHaveLength(1);
    expect(records[0].rank).toBe(1);
  });
});
