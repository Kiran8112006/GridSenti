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

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.config import ORIGINAL_FEATURES, ALL_FEATURES, RAW_CSV_PATH, HIF_CLASS_LABEL
from ml.preprocessing import load_dataset, clean_dataset, prepare_labels, inspect_dataset
from ml.feature_extraction import extract_features, validate_feature_vector
from ml.rule_engine import classify_sample, classify_dataframe
from ml.train import run_training
from ml.model_utils import load_model, check_model_artifacts_exist
from ml.predict import predict_hif


def test_dataset_loading_and_inspection():
    df = load_dataset(RAW_CSV_PATH)
    assert not df.empty
    assert "Class" in df.columns
    for feat in ORIGINAL_FEATURES:
        assert feat in df.columns

    report = inspect_dataset(df)
    assert "shape" in report
    assert "duplicate_analysis" in report


def test_preprocessing_and_labels():
    df_raw = load_dataset(RAW_CSV_PATH)
    df_clean = clean_dataset(df_raw)
    assert len(df_clean) <= len(df_raw)

    df_labelled = prepare_labels(df_clean)
    assert "label_binary" in df_labelled.columns
    assert set(df_labelled["label_binary"].unique()).issubset({"HIF", "NON_HIF"})


def test_feature_extraction_no_nan_inf():
    sample_df = pd.DataFrame([
        {"EA": 4.23e10, "EB": 4.84e9, "EC": 1.52e10},
        {"EA": 1e-9, "EB": 1e-9, "EC": 1e-9},
        {"EA": 1e12, "EB": 1e12, "EC": 1e12},
    ])
    features = extract_features(sample_df)

    assert set(ALL_FEATURES).issubset(set(features.columns))
    assert not features.isnull().any().any()
    assert not features.isin([np.inf, -np.inf]).any().any()

    validate_feature_vector(features.iloc[0])


def test_rule_engine_normal_vs_hif_samples():
    """Explicit test covering Test 1 (NORMAL) and Test 2 (HIF) sample inputs."""
    # Test 1 — NORMAL sample
    norm_features = extract_features(pd.DataFrame([{"EA": 4.23e10, "EB": 4.84e9, "EC": 1.52e10}])).iloc[0]
    res_norm = classify_sample(norm_features)
    assert res_norm["classification"] == "NORMAL"
    assert res_norm["score"] == 0.0

    # Test 2 — HIF sample
    hif_features = extract_features(pd.DataFrame([{"EA": 5.57e10, "EB": 4.88e9, "EC": 1.51e10}])).iloc[0]
    res_hif = classify_sample(hif_features)
    assert res_hif["classification"] == "POSSIBLE_HIF"
    assert res_hif["score"] >= 60.0
    assert len(res_hif["reasons"]) > 0


def test_model_training_saving_loading():
    train_results = run_training()
    assert "cv_metrics" in train_results
    assert check_model_artifacts_exist()

    model = load_model()
    assert model is not None


def test_predict_hif_api():
    res = predict_hif(ea=4.23e10, eb=4.84e9, ec=1.52e10)
    assert res["model_loaded"] is True
    assert res["classification"] == "NON_HIF"
    assert res["model_probability"]["HIF"] == 0.0
    assert res["rule_engine"]["classification"] == "NORMAL"
