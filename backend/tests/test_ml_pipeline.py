"""
GridSenti — ML Pipeline Tests
=============================
Tests for preprocessing, feature extraction, rule engine, model training/loading, and prediction API.
"""

import sys
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.config import ORIGINAL_FEATURES, ALL_FEATURES, RAW_CSV_PATH, HIF_CLASS_LABEL
from ml.preprocessing import load_dataset, clean_dataset, prepare_labels, inspect_dataset
from ml.feature_extraction import extract_features, validate_feature_vector
from ml.rule_engine import classify_sample, classify_dataframe
from ml.train import run_training
from ml.model_utils import load_model, check_model_artifacts_exist
from ml.predict import predict_hif


def test_dataset_loading_and_inspection():
    """Verify raw dataset exists, loads properly, and inspect returns metadata."""
    df = load_dataset(RAW_CSV_PATH)
    assert not df.empty
    assert "Class" in df.columns
    for feat in ORIGINAL_FEATURES:
        assert feat in df.columns

    report = inspect_dataset(df)
    assert "shape" in report
    assert "duplicate_analysis" in report


def test_preprocessing_and_labels():
    """Verify cleaning and label preparation logic."""
    df_raw = load_dataset(RAW_CSV_PATH)
    df_clean = clean_dataset(df_raw)
    assert len(df_clean) <= len(df_raw)

    df_labelled = prepare_labels(df_clean)
    assert "label_binary" in df_labelled.columns
    assert set(df_labelled["label_binary"].unique()).issubset({"HIF", "NON_HIF"})


def test_feature_extraction_no_nan_inf():
    """Verify feature extraction produces expected columns with zero NaN/Inf values."""
    sample_df = pd.DataFrame([
        {"EA": 4.23e10, "EB": 4.84e9, "EC": 1.52e10},
        {"EA": 1e-9, "EB": 1e-9, "EC": 1e-9}, # Extreme small numbers
        {"EA": 1e12, "EB": 1e12, "EC": 1e12}, # Equal high energy
    ])
    features = extract_features(sample_df)

    assert set(ALL_FEATURES).issubset(set(features.columns))
    assert not features.isnull().any().any()
    assert not features.isin([np.inf, -np.inf]).any().any()

    # Test single vector validation
    validate_feature_vector(features.iloc[0])


def test_rule_engine_behavior():
    """Verify rule engine returns valid classification format and phase-agnostic score."""
    sample_normal = {"energy_imbalance": 0.02, "energy_spread": 100, "total_energy": 10000, "max_energy": 3400, "min_energy": 3200}
    res_normal = classify_sample(sample_normal)
    assert res_normal["classification"] == "NORMAL"
    assert res_normal["score"] < 30.0

    sample_hif = {"energy_imbalance": 0.35, "energy_spread": 5000, "total_energy": 10000, "max_energy": 7000, "min_energy": 1000}
    res_hif = classify_sample(sample_hif)
    assert res_hif["classification"] in ["SUSPICIOUS", "POSSIBLE_HIF"]
    assert len(res_hif["reasons"]) > 0


def test_model_training_saving_loading():
    """Verify training pipeline executes, saves model, and model can be reloaded."""
    train_results = run_training()
    assert "cv_metrics" in train_results
    assert check_model_artifacts_exist()

    model = load_model()
    assert model is not None


def test_predict_hif_api():
    """Verify predict_hif() interface works end-to-end."""
    res = predict_hif(ea=4.23e10, eb=4.84e9, ec=1.52e10)
    assert res["model_loaded"] is True
    assert res["classification"] in ["HIF", "NON_HIF"]
    assert "model_probability" in res
    assert "HIF" in res["model_probability"]
    assert "rule_engine" in res
    assert "features_used" in res
