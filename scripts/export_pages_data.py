#!/usr/bin/env python3
"""Export static JSON assets for the GitHub Pages research viewer."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT = ROOT / "assets" / "data"
TRAINING_SOURCE = ROOT / "data" / "PhosIrDB.csv"
TEST_PLQY_SOURCE = (
    ROOT
    / "Project_Output"
    / "all_models"
    / "automl_train"
    / "xgboost"
    / "exports"
    / "test_predictions_xgboost_PLQY.csv"
)
TEST_WAVELENGTH_SOURCE = (
    ROOT
    / "Project_Output"
    / "all_models"
    / "automl_train"
    / "xgboost"
    / "exports"
    / "test_predictions_xgboost_Max_wavelength(nm).csv"
)
VIRTUAL_SOURCE = ROOT / "Project_Output" / "virtual_predictions_all.csv"


@dataclass
class ExportStats:
    training_count: int
    test_count: int
    virtual_total_count: int
    virtual_focus_count: int
    representative_labels: list[str]
    solvent_counts: dict[str, int]
    wavelength_range_nm: dict[str, float]
    plqy_range: dict[str, float]
    virtual_threshold_counts: dict[str, int]


def coerce_value(value: Any) -> Any:
    if pd.isna(value):
        return None
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            pass
    return value


def clean_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{key: coerce_value(value) for key, value in row.items()} for row in records]


def normalize_training(df: pd.DataFrame) -> list[dict[str, Any]]:
    renamed = df.rename(
        columns={
            "Unnamed: 0": "row_index",
            "Abbreviation_in_the_article": "label",
            "Max_wavelength(nm)": "max_wavelength_nm",
            "tau(s*10^-6)": "lifetime_us",
            "Counterion": "counterion",
            "Charge": "charge",
            "Solvent": "solvent",
            "Notes": "notes",
            "DOI": "doi",
            "PLQY": "plqy",
        }
    )
    records: list[dict[str, Any]] = []
    for row in renamed.to_dict(orient="records"):
        records.append(
            {
                "id": f"train-{int(row['row_index'])}",
                "rowIndex": row["row_index"],
                "label": row.get("label"),
                "l1": row.get("L1"),
                "l2": row.get("L2"),
                "l3": row.get("L3"),
                "counterion": row.get("counterion"),
                "charge": row.get("charge"),
                "maxWavelengthNm": row.get("max_wavelength_nm"),
                "plqy": row.get("plqy"),
                "lifetimeUs": row.get("lifetime_us"),
                "solvent": row.get("solvent"),
                "doi": row.get("doi"),
                "notes": row.get("notes"),
                "source": "training",
            }
        )
    return clean_records(records)


def normalize_test(plqy_df: pd.DataFrame, wavelength_df: pd.DataFrame) -> list[dict[str, Any]]:
    key = ["Unnamed: 0", "L1", "L2", "L3"]
    merged = wavelength_df[key + ["prediction", "Max_wavelength(nm)", "PLQY", "Abbreviation_in_the_article"]].rename(
        columns={"prediction": "predicted_wavelength_nm"}
    ).merge(
        plqy_df[key + ["prediction"]].rename(columns={"prediction": "predicted_plqy"}),
        on=key,
        how="inner",
        validate="one_to_one",
    )
    records: list[dict[str, Any]] = []
    for row in merged.to_dict(orient="records"):
        record_id = str(row["Unnamed: 0"])
        records.append(
            {
                "id": record_id,
                "displayName": record_id,
                "articleLabel": row.get("Abbreviation_in_the_article"),
                "l1": row.get("L1"),
                "l2": row.get("L2"),
                "l3": row.get("L3"),
                "actualMaxWavelengthNm": row.get("Max_wavelength(nm)"),
                "predictedMaxWavelengthNm": row.get("predicted_wavelength_nm"),
                "actualPlqy": row.get("PLQY"),
                "predictedPlqy": row.get("predicted_plqy"),
                "wavelengthErrorNm": (
                    row.get("predicted_wavelength_nm") - row.get("Max_wavelength(nm)")
                    if pd.notna(row.get("predicted_wavelength_nm")) and pd.notna(row.get("Max_wavelength(nm)"))
                    else None
                ),
                "plqyError": (
                    row.get("predicted_plqy") - row.get("PLQY")
                    if pd.notna(row.get("predicted_plqy")) and pd.notna(row.get("PLQY"))
                    else None
                ),
                "roundedPrediction": {
                    "maxWavelengthNm": (
                        round(float(row["predicted_wavelength_nm"]))
                        if pd.notna(row.get("predicted_wavelength_nm"))
                        else None
                    ),
                    "plqy": (
                        round(float(row["predicted_plqy"]), 2)
                        if pd.notna(row.get("predicted_plqy"))
                        else None
                    ),
                },
                "source": "xgboost_test_export",
            }
        )
    return clean_records(records)


def normalize_virtual(df: pd.DataFrame, limit: int = 5000) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    ranked = df.sort_values(["Predicted_PLQY", "Predicted_wavelength"], ascending=[False, False]).reset_index(drop=True)
    plqy_focus = ranked[ranked["Predicted_PLQY"] >= 0.70].copy()
    if len(plqy_focus) >= limit:
        selected = plqy_focus.head(limit).copy()
        selection_note = "Top predicted-PLQY candidates with Predicted_PLQY >= 0.70."
    else:
        selected = pd.concat([plqy_focus, ranked.iloc[len(plqy_focus) : limit]], ignore_index=True)
        selection_note = (
            "All candidates with Predicted_PLQY >= 0.70 plus the highest remaining predicted-PLQY entries "
            f"to reach {limit} records."
        )

    records: list[dict[str, Any]] = []
    for rank, row in enumerate(selected.to_dict(orient="records"), start=1):
        records.append(
            {
                "id": f"virtual-{rank}",
                "rank": rank,
                "l1": row.get("L1"),
                "l2": row.get("L2"),
                "l3": row.get("L3"),
                "predictedMaxWavelengthNm": row.get("Predicted_wavelength"),
                "predictedPlqy": row.get("Predicted_PLQY"),
                "combinedScore": (
                    (float(row["Predicted_PLQY"]) * 0.7) + (float(row["Predicted_wavelength"]) / 900.0 * 0.3)
                    if pd.notna(row.get("Predicted_PLQY")) and pd.notna(row.get("Predicted_wavelength"))
                    else None
                ),
                "source": "virtual_focus",
            }
        )

    summary = {
        "selectionNote": selection_note,
        "topPredictedPlqy": coerce_value(selected["Predicted_PLQY"].max()),
        "topPredictedWavelengthNm": coerce_value(selected["Predicted_wavelength"].max()),
        "thresholdCountsInFullSet": {
            "plqy>=0.60": int((df["Predicted_PLQY"] >= 0.60).sum()),
            "plqy>=0.70": int((df["Predicted_PLQY"] >= 0.70).sum()),
            "plqy>=0.80": int((df["Predicted_PLQY"] >= 0.80).sum()),
            "plqy>=0.90": int((df["Predicted_PLQY"] >= 0.90).sum()),
        },
    }
    return clean_records(records), clean_records([summary])[0]


def build_overview(
    training_records: list[dict[str, Any]],
    test_records: list[dict[str, Any]],
    virtual_records: list[dict[str, Any]],
    virtual_df: pd.DataFrame,
) -> ExportStats:
    solvents = pd.Series([record.get("solvent") for record in training_records if record.get("solvent")]).value_counts()
    training_wavelengths = pd.Series([record.get("maxWavelengthNm") for record in training_records], dtype="float64").dropna()
    training_plqy = pd.Series([record.get("plqy") for record in training_records], dtype="float64").dropna()

    return ExportStats(
        training_count=len(training_records),
        test_count=len(test_records),
        virtual_total_count=int(len(virtual_df)),
        virtual_focus_count=len(virtual_records),
        representative_labels=[record["displayName"] for record in test_records],
        solvent_counts={str(key): int(value) for key, value in solvents.items()},
        wavelength_range_nm={
            "min": float(training_wavelengths.min()),
            "max": float(training_wavelengths.max()),
        },
        plqy_range={
            "min": float(training_plqy.min()),
            "max": float(training_plqy.max()),
        },
        virtual_threshold_counts={
            "plqy>=0.60": int((virtual_df["Predicted_PLQY"] >= 0.60).sum()),
            "plqy>=0.70": int((virtual_df["Predicted_PLQY"] >= 0.70).sum()),
            "plqy>=0.80": int((virtual_df["Predicted_PLQY"] >= 0.80).sum()),
            "plqy>=0.90": int((virtual_df["Predicted_PLQY"] >= 0.90).sum()),
        },
    )


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def export(output_dir: Path) -> None:
    training_df = pd.read_csv(TRAINING_SOURCE)
    test_plqy_df = pd.read_csv(TEST_PLQY_SOURCE)
    test_wavelength_df = pd.read_csv(TEST_WAVELENGTH_SOURCE)
    virtual_df = pd.read_csv(VIRTUAL_SOURCE)

    training_records = normalize_training(training_df)
    test_records = normalize_test(test_plqy_df, test_wavelength_df)
    virtual_records, virtual_summary = normalize_virtual(virtual_df)
    overview = build_overview(training_records, test_records, virtual_records, virtual_df)

    generated_at = datetime.now(timezone.utc).isoformat()

    write_json(
        output_dir / "overview.json",
        {
            "generatedAt": generated_at,
            "sources": {
                "training": str(TRAINING_SOURCE.relative_to(ROOT)),
                "testPlqy": str(TEST_PLQY_SOURCE.relative_to(ROOT)),
                "testWavelength": str(TEST_WAVELENGTH_SOURCE.relative_to(ROOT)),
                "virtual": str(VIRTUAL_SOURCE.relative_to(ROOT)),
            },
            "stats": asdict(overview),
        },
    )
    write_json(output_dir / "training_data.json", {"generatedAt": generated_at, "records": training_records})
    write_json(output_dir / "test_predictions_xgboost.json", {"generatedAt": generated_at, "records": test_records})
    write_json(
        output_dir / "virtual_predictions_top5000.json",
        {"generatedAt": generated_at, "selection": virtual_summary["selectionNote"], "records": virtual_records},
    )
    write_json(
        output_dir / "virtual_predictions_summary.json",
        {"generatedAt": generated_at, **virtual_summary},
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Directory to receive exported JSON assets (default: {DEFAULT_OUTPUT})",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    export(args.output.resolve())
    print(f"Exported Pages viewer data to {args.output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
