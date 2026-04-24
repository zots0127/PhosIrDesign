import os
import re
import subprocess
from pathlib import Path

import joblib
import numpy as np
from sklearn.preprocessing import StandardScaler

from phosirdesign.models.base import BaseModel
from phosirdesign.utils.project_predictor import ProjectPredictor


REPO_ROOT = Path(__file__).resolve().parents[1]


class ZeroPredictor:
    def predict(self, X):
        return np.zeros(len(X), dtype=float)


class ConstantPredictor:
    def __init__(self, value):
        self.value = float(value)

    def predict(self, X):
        return np.full(len(X), self.value, dtype=float)


def run_workflow(env_overrides):
    env = os.environ.copy()
    env.update(env_overrides)
    return subprocess.run(
        ["bash", "scripts/workflows/workflow.sh"],
        cwd=REPO_ROOT,
        env=env,
        text=True,
        capture_output=True,
    )


def test_workflow_uses_timestamped_output_dir_by_default():
    result = run_workflow(
        {
            "DATA_FILE": "/definitely/missing.csv",
            "TEST_DATA_FILE": "/definitely/missing_test.csv",
            "VIRTUAL_FILE": "/definitely/missing_virtual.csv",
            "SKIP_VIRTUAL": "1",
            "SKIP_FIGURES": "1",
            "SKIP_SHAP": "1",
        }
    )

    combined = result.stdout + result.stderr
    assert result.returncode != 0
    assert re.search(r"Output:\s+Project_Output_\d{8}_\d{6}", combined)


def test_workflow_rejects_existing_output_dir_with_artifacts(tmp_path):
    output_dir = tmp_path / "existing_output"
    output_dir.mkdir()
    (output_dir / "virtual_predictions_all.csv").write_text("dummy\n", encoding="utf-8")

    result = run_workflow(
        {
            "OUTPUT_DIR": str(output_dir),
            "DATA_FILE": "/definitely/missing.csv",
            "TEST_DATA_FILE": "/definitely/missing_test.csv",
            "VIRTUAL_FILE": "/definitely/missing_virtual.csv",
            "SKIP_VIRTUAL": "1",
            "SKIP_FIGURES": "1",
            "SKIP_SHAP": "1",
        }
    )

    combined = result.stdout + result.stderr
    assert result.returncode != 0
    assert "already contains workflow artifacts" in combined


def test_basemodel_load_restores_target_scaler(tmp_path):
    model = BaseModel("mlp")
    model.model = ZeroPredictor()
    model.scaler = StandardScaler().fit(np.array([[1.0], [2.0], [3.0]]))
    model.target_scaler = StandardScaler().fit(np.array([[10.0], [20.0], [30.0]]))
    model.is_trained = True

    model_path = tmp_path / "mlp_model.joblib"
    model.save(model_path)

    loaded = BaseModel("mlp")
    loaded.load(model_path)
    preds = loaded.predict(np.array([[4.0], [5.0]]))

    assert loaded.target_scaler is not None
    assert np.allclose(preds, np.array([20.0, 20.0]))


def test_project_predictor_parses_model_names_and_wraps_saved_models(tmp_path):
    base_dir = tmp_path / "project" / "all_models" / "automl_train"

    random_forest_dir = base_dir / "random_forest" / "models"
    random_forest_dir.mkdir(parents=True)
    rf_target_scaler = StandardScaler().fit(np.array([[0.2], [0.4], [0.6]]))
    joblib.dump(
        {
            "model": ZeroPredictor(),
            "scaler": None,
            "target_scaler": rf_target_scaler,
            "model_type": "mlp",
        },
        random_forest_dir / "random_forest_PLQY_final.joblib",
    )

    gb_dir = base_dir / "gradient_boosting" / "models"
    gb_dir.mkdir(parents=True)
    joblib.dump(
        ConstantPredictor(123.0),
        gb_dir / "gradient_boosting_Max_wavelength_nm_final.joblib",
    )

    predictor = ProjectPredictor(str(tmp_path / "project"), verbose=False)

    assert "random_forest_PLQY" in predictor.models
    assert predictor.models["random_forest_PLQY"]["type"] == "random_forest"
    assert predictor.models["random_forest_PLQY"]["original_target"] == "PLQY"

    wrapped_model = predictor.models["random_forest_PLQY"]["model"]
    wrapped_preds = wrapped_model.predict(np.array([[1.0], [2.0]]))
    assert np.allclose(wrapped_preds, np.array([0.4, 0.4]))

    assert "gradient_boosting_Max_wavelength_nm" in predictor.models
    assert predictor.models["gradient_boosting_Max_wavelength_nm"]["type"] == "gradient_boosting"
    assert predictor.models["gradient_boosting_Max_wavelength_nm"]["original_target"] == "Max_wavelength(nm)"
