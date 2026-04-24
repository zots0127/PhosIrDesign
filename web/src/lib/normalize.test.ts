import { describe, expect, it } from "vitest";
import { buildMoleculeTitle, computeOverviewCards, sortSolvents } from "./normalize";
import type { OverviewPayload, VirtualSummaryPayload } from "../types/data";

describe("normalize helpers", () => {
  it("prefers display name and label when building molecule titles", () => {
    expect(
      buildMoleculeTitle({
        id: "Ir1",
        displayName: "Ir1",
        articleLabel: "Ir1",
        l1: "A",
        l2: "B",
        l3: "C",
        actualMaxWavelengthNm: 574,
        predictedMaxWavelengthNm: 559.4,
        actualPlqy: 0.88,
        predictedPlqy: 0.81,
        wavelengthErrorNm: -14.6,
        plqyError: -0.06,
        roundedPrediction: { maxWavelengthNm: 559, plqy: 0.82 },
        source: "xgboost_test_export",
      }),
    ).toBe("Ir1");
    expect(
      buildMoleculeTitle({
        id: "train-1",
        rowIndex: 1,
        label: "E1",
        l1: "A",
        l2: "B",
        l3: "C",
        counterion: null,
        charge: 1,
        maxWavelengthNm: 600,
        plqy: 0.1,
        lifetimeUs: null,
        solvent: "CH2Cl2",
        doi: null,
        notes: null,
        source: "training",
      }),
    ).toBe("E1");
  });

  it("sorts solvents alphabetically and removes nulls", () => {
    expect(
      sortSolvents([
        {
          id: "train-1",
          rowIndex: 1,
          label: "E1",
          l1: "A",
          l2: "B",
          l3: "C",
          counterion: null,
          charge: 1,
          maxWavelengthNm: 600,
          plqy: 0.1,
          lifetimeUs: null,
          solvent: "Toluene",
          doi: null,
          notes: null,
          source: "training",
        },
        {
          id: "train-2",
          rowIndex: 2,
          label: "E2",
          l1: "A",
          l2: "B",
          l3: "C",
          counterion: null,
          charge: 1,
          maxWavelengthNm: 610,
          plqy: 0.2,
          lifetimeUs: null,
          solvent: "CH2Cl2",
          doi: null,
          notes: null,
          source: "training",
        },
      ]),
    ).toEqual(["CH2Cl2", "Toluene"]);
  });

  it("builds overview metric cards from exported stats", () => {
    const overview: OverviewPayload = {
      generatedAt: "2026-04-20T00:00:00+00:00",
      sources: {},
      stats: {
        training_count: 1667,
        test_count: 5,
        virtual_total_count: 270660,
        virtual_focus_count: 5000,
        representative_labels: ["Ir1", "Ir2"],
        solvent_counts: { CH2Cl2: 1200 },
        wavelength_range_nm: { min: 430, max: 875 },
        plqy_range: { min: 0.0, max: 1.0 },
        virtual_threshold_counts: { "plqy>=0.80": 879 },
      },
    };
    const summary: VirtualSummaryPayload = {
      generatedAt: "2026-04-20T00:00:00+00:00",
      selectionNote: "top subset",
      topPredictedPlqy: 1,
      topPredictedWavelengthNm: 874,
      thresholdCountsInFullSet: { "plqy>=0.80": 879 },
    };

    const cards = computeOverviewCards(overview, summary);
    expect(cards).toHaveLength(4);
    expect(cards[0].value).toBe("1,667");
    expect(cards[3].value).toBe("879");
  });
});
