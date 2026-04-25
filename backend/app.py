"""FastAPI backend for PhosIrDesign model prediction."""

from __future__ import annotations

import os
import sys
from functools import lru_cache
from pathlib import Path
from typing import Literal

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from phosirdesign.core.feature_extractor import FeatureExtractor
from phosirdesign.models.base import load_model


MODEL_DIR = Path(os.environ.get("PHOSIR_MODEL_DIR", ROOT / "backend" / "model_artifacts"))
DATA_PATH = Path(os.environ.get("PHOSIR_DATA_PATH", ROOT / "data" / "PhosIrDB.csv"))
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "PHOSIR_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]


class PredictionRequest(BaseModel):
    l1: str = Field(..., min_length=1)
    l2: str = Field(..., min_length=1)
    l3: str = Field(..., min_length=1)


class PredictionResponse(BaseModel):
    modelFamily: Literal["xgboost"]
    featureType: Literal["combined"]
    combinationMethod: Literal["mean"]
    predictedMaxWavelengthNm: float
    predictedPlqy: float


class LigandSummary(BaseModel):
    smiles: str
    roles: dict[Literal["L1", "L2", "L3"], int]


@lru_cache(maxsize=1)
def get_models():
    wavelength_path = MODEL_DIR / "xgboost_Max_wavelength_nm_final.joblib"
    plqy_path = MODEL_DIR / "xgboost_PLQY_final.joblib"
    if not wavelength_path.exists() or not plqy_path.exists():
        raise FileNotFoundError(f"Missing XGBoost model artifacts in {MODEL_DIR}")
    return {
        "wavelength": load_model(wavelength_path),
        "PLQY": load_model(plqy_path),
    }


@lru_cache(maxsize=1)
def get_extractor() -> FeatureExtractor:
    return FeatureExtractor(
        feature_type="combined",
        morgan_radius=2,
        morgan_bits=1024,
        descriptor_count=85,
        use_cache=True,
    )


@lru_cache(maxsize=1)
def get_ligands() -> list[LigandSummary]:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Missing data file: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH, usecols=["L1", "L2", "L3"])
    role_counts: dict[str, dict[Literal["L1", "L2", "L3"], int]] = {}
    for role in ["L1", "L2", "L3"]:
        counts = df[role].dropna().astype(str).value_counts()
        for smiles, count in counts.items():
            role_counts.setdefault(smiles, {"L1": 0, "L2": 0, "L3": 0})
            role_counts[smiles][role] += int(count)
    return [
        LigandSummary(smiles=smiles, roles=roles)
        for smiles, roles in sorted(role_counts.items(), key=lambda item: item[0])
    ]


app = FastAPI(
    title="PhosIrDesign Predictor API",
    version="0.1.0",
    description="RDKit + XGBoost prediction API for known Ir(III) emitter ligand combinations.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str | int]:
    models = get_models()
    ligands = get_ligands()
    return {
        "status": "ok",
        "modelFamily": "xgboost",
        "modelCount": len(models),
        "ligandCount": len(ligands),
    }


@app.get("/ligands", response_model=list[LigandSummary])
def ligands() -> list[LigandSummary]:
    return get_ligands()


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest) -> PredictionResponse:
    try:
        extractor = get_extractor()
        features = extractor.extract_combination(
            [payload.l1, payload.l2, payload.l3],
            feature_type="combined",
            combination_method="mean",
        ).reshape(1, -1)
        models = get_models()
        wavelength = float(models["wavelength"].predict(features)[0])
        plqy = float(models["PLQY"].predict(features)[0])
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Prediction failed: {exc}") from exc

    return PredictionResponse(
        modelFamily="xgboost",
        featureType="combined",
        combinationMethod="mean",
        predictedMaxWavelengthNm=wavelength,
        predictedPlqy=plqy,
    )
