"""
GridSenti — ml/multiclass_predict.py
=====================================
Inference interface for multi-class fault classification.

Classes: Normal, LG, LLG, LLLG, LL, HIF, CS, LS
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Dict

import joblib
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.config import MODELS_DIR
from ml.feature_extraction import extract_features

MULTICLASS_MODEL_PATH = MODELS_DIR / "multiclass_random_forest.joblib"
MULTICLASS_LABEL_ENCODER_PATH = MODELS_DIR / "multiclass_label_encoder.joblib"

_multiclass_model = None
_multiclass_le = None


def _load_multiclass_artifacts():
    global _multiclass_model, _multiclass_le
    if _multiclass_model is None and MULTICLASS_MODEL_PATH.exists():
        _multiclass_model = joblib.load(MULTICLASS_MODEL_PATH)
    if _multiclass_le is None and MULTICLASS_LABEL_ENCODER_PATH.exists():
        _multiclass_le = joblib.load(MULTICLASS_LABEL_ENCODER_PATH)


def predict_multiclass_fault(ea: float, eb: float, ec: float) -> Dict:
    """
    Predict multi-class fault type from EA, EB, EC features.

    Returns
    -------
    dict with:
        faultType: str
        faultTypeProbability: float
        faultTypeProbabilities: dict[str, float]
        modelLoaded: bool
    """
    _load_multiclass_artifacts()

    if _multiclass_model is None or _multiclass_le is None:
        # Fallback if model not trained yet
        return {
            "faultType": "Normal",
            "faultTypeProbability": 1.0,
            "faultTypeProbabilities": {"Normal": 1.0},
            "modelLoaded": False,
        }

    raw_df = pd.DataFrame([{"EA": float(ea), "EB": float(eb), "EC": float(ec)}])
    features = extract_features(raw_df)

    pred_idx = _multiclass_model.predict(features)[0]
    probs = _multiclass_model.predict_proba(features)[0]

    classes = list(_multiclass_le.classes_)
    pred_label = str(_multiclass_le.inverse_transform([pred_idx])[0])

    prob_dict = {
        cls: round(float(prob), 4)
        for cls, prob in zip(classes, probs)
    }

    max_prob = round(float(probs[pred_idx]), 4)

    return {
        "faultType": pred_label,
        "faultTypeProbability": max_prob,
        "faultTypeProbabilities": prob_dict,
        "modelLoaded": True,
    }
