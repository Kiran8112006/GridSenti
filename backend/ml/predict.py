"""
GridSenti — ml/predict.py
==========================
Inference API for the trained HIF detection model.

This module is the sole integration point between:
  fastapi routes  ->  app/detection/hif_detector.py  ->  ml/predict.py

No ML logic is duplicated in app/detection/.

Usage
-----
  from ml.predict import predict_hif, predict_hif_from_raw

  # From pre-extracted DWT features
  result = predict_hif(ea=4.23e10, eb=4.84e9, ec=1.52e10)

  # Returns:
  # {
  #     "classification":    "NON_HIF" | "HIF",
  #     "model_probability": {"HIF": 0.12, "NON_HIF": 0.88},
  #     "rule_engine":       {...},
  #     "features_used":     {...},
  #     "model_loaded":      True,
  # }

Note on "probability":
  We report predict_proba() output as "model_probability", NOT "confidence".
  A Random Forest predict_proba is NOT a calibrated probability in the
  statistical sense.  It reflects the fraction of trees voting for each class.
  Use Platt scaling or isotonic regression for calibrated probabilities in
  production.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Dict, Optional

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.config import ALL_FEATURES, HIF_CLASS_LABEL, EPSILON
from ml.feature_extraction import extract_features, validate_feature_vector
from ml.model_utils import load_model, load_feature_names, check_model_artifacts_exist
from ml.rule_engine import classify_sample


# ── Public API ────────────────────────────────────────────────────────────────

def predict_hif(
    ea: float,
    eb: float,
    ec: float,
) -> Dict:
    """
    Run HIF classification from raw DWT energy inputs (EA, EB, EC).

    Parameters
    ----------
    ea : float
        DWT energy feature, Phase A (from original dataset convention).
    eb : float
        DWT energy feature, Phase B.
    ec : float
        DWT energy feature, Phase C.

    Returns
    -------
    dict with:
        classification    : str  — "HIF" or "NON_HIF"
        model_probability : dict — {"HIF": float, "NON_HIF": float}
                            (Random Forest vote fraction — NOT calibrated prob.)
        rule_engine       : dict — rule engine output
        features_used     : dict — all feature values used
        model_loaded      : bool
        error             : str (only if prediction failed)
    """
    try:
        # Build input row
        input_row = pd.DataFrame([{"EA": float(ea), "EB": float(eb), "EC": float(ec)}])

        # Extract all features
        feature_row = extract_features(input_row)
        feature_values = feature_row.iloc[0]

        # Validate features
        validate_feature_vector(feature_values)

        # Rule engine
        rule_result = classify_sample(feature_values)

        # ML model
        model = load_model()
        feature_names = load_feature_names()
        X = feature_row[feature_names].values  # shape (1, n_features)

        classes = list(model.classes_)
        proba = model.predict_proba(X)[0]
        pred_class = model.predict(X)[0]

        prob_dict = {cls: round(float(p), 4) for cls, p in zip(classes, proba)}

        return {
            "classification":    pred_class,
            "model_probability": prob_dict,
            "rule_engine":       rule_result,
            "features_used":     feature_values[ALL_FEATURES].to_dict(),
            "model_loaded":      True,
        }

    except FileNotFoundError as exc:
        return {
            "classification":    None,
            "model_probability": None,
            "rule_engine":       None,
            "features_used":     None,
            "model_loaded":      False,
            "error": str(exc),
        }
    except Exception as exc:
        return {
            "classification":    None,
            "model_probability": None,
            "rule_engine":       None,
            "features_used":     None,
            "model_loaded":      check_model_artifacts_exist(),
            "error": str(exc),
        }


def predict_batch(df: pd.DataFrame) -> pd.DataFrame:
    """
    Run prediction on a DataFrame containing at least columns EA, EB, EC.

    Returns df with added columns:
      predicted_class, prob_HIF, prob_NON_HIF, rule_classification, rule_score
    """
    model = load_model()
    feature_names = load_feature_names()

    feature_df = extract_features(df)
    X = feature_df[feature_names].values

    classes = list(model.classes_)
    proba = model.predict_proba(X)
    preds = model.predict(X)

    out = df.copy()
    out["predicted_class"] = preds
    for i, cls in enumerate(classes):
        out[f"prob_{cls}"] = proba[:, i]

    # Rule engine
    from ml.rule_engine import classify_dataframe
    rule_out = classify_dataframe(feature_df)
    out["rule_classification"] = rule_out["rule_classification"]
    out["rule_score"]          = rule_out["rule_score"]

    return out


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import json

    print("=" * 60)
    print("GridSenti — HIF Prediction Module Test")
    print("=" * 60)

    # Test with a Normal-class sample (first row of dataset)
    print("\nTest 1: Normal sample (EA=4.23e10, EB=4.84e9, EC=1.52e10)")
    result1 = predict_hif(ea=4.23e10, eb=4.84e9, ec=1.52e10)
    print(json.dumps(result1, indent=2, default=str))

    # Test with values from LG class
    print("\nTest 2: LG-class sample (EA=4.26e10, EB=4.83e9, EC=3.26e10)")
    result2 = predict_hif(ea=4.26e10, eb=4.83e9, ec=3.26e10)
    print(json.dumps(result2, indent=2, default=str))

    # Load actual HIF rows from dataset and test
    from ml.preprocessing import run_preprocessing_pipeline
    from ml.config import HIF_CLASS_LABEL, TARGET_COLUMN

    df = run_preprocessing_pipeline(save=False)
    hif_rows = df[df[TARGET_COLUMN] == HIF_CLASS_LABEL]

    if not hif_rows.empty:
        row = hif_rows.iloc[0]
        print(f"\nTest 3: Actual HIF row from dataset")
        print(f"  EA={row['EA']:.3e}, EB={row['EB']:.3e}, EC={row['EC']:.3e}")
        result3 = predict_hif(ea=row["EA"], eb=row["EB"], ec=row["EC"])
        print(json.dumps(result3, indent=2, default=str))
    else:
        print("\n[WARN] No HIF rows found in dataset for test 3.")

    print("\n✅ Prediction module tests complete.")
