"""
GridSenti — ml/rule_engine.py
==============================
Prototype rule-based HIF detection baseline.

PURPOSE
-------
This rule engine is a research/prototype baseline.
It is NOT a production utility protection relay.
It is NOT calibrated against field data.
It provides an explainable pre-ML filter and a benchmark for the ML model.

RULES
-----
All rules are phase-agnostic (no EC-specific or phase-specific bias).
Rules are based on DWT energy imbalance and spread — quantities that can be
computed from the original EA/EB/EC features.

THRESHOLDS
----------
All thresholds are PROTOTYPE THRESHOLDS.
They require field/utility validation before production use.
They are defined in ml/config.py:RULE_THRESHOLDS so they can be adjusted
without modifying logic.

OUTPUT
------
Returns a dict:
  {
      "classification": "NORMAL" | "SUSPICIOUS" | "POSSIBLE_HIF",
      "score": float (0–100),
      "reasons": [str, ...],    # list of triggered rule descriptions
      "features_used": {str: float, ...}  # features the engine read
  }
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Dict, List, Union

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.config import RULE_THRESHOLDS, EPSILON


# ── Classification labels ─────────────────────────────────────────────────────
CLASSIFICATION_NORMAL      = "NORMAL"
CLASSIFICATION_SUSPICIOUS  = "SUSPICIOUS"
CLASSIFICATION_POSSIBLE_HIF = "POSSIBLE_HIF"


# ── Public API ────────────────────────────────────────────────────────────────

def classify_sample(features: Union[dict, pd.Series]) -> Dict:
    """
    Apply the prototype rule engine to a single feature vector.

    Parameters
    ----------
    features : dict or pd.Series
        Must contain at minimum:
          - energy_imbalance  (normalised phase energy imbalance)
          - energy_spread     (max_energy - min_energy)
          - total_energy
          - max_energy
          - min_energy

    Returns
    -------
    dict with keys: classification, score, reasons, features_used
    """
    # Extract required features safely
    imbalance    = float(features.get("energy_imbalance", 0.0))
    spread       = float(features.get("energy_spread", 0.0))
    total        = float(features.get("total_energy", 1.0))
    max_e        = float(features.get("max_energy", 0.0))
    min_e        = float(features.get("min_energy", 0.0))

    # Relative spread: spread as a fraction of total energy
    relative_spread = spread / (total + EPSILON)

    reasons: List[str] = []
    imbalance_score = 0.0
    spread_score    = 0.0

    # ── Rule 1: Phase energy imbalance ────────────────────────────────────────
    # High imbalance across all three phases (phase-agnostic)
    # Prototype threshold — requires field validation
    if imbalance >= RULE_THRESHOLDS["imbalance_hif"]:
        imbalance_score = 1.0
        reasons.append(
            f"High phase energy imbalance ({imbalance:.3f} >= "
            f"{RULE_THRESHOLDS['imbalance_hif']:.2f} - prototype threshold)"
        )
    elif imbalance >= RULE_THRESHOLDS["imbalance_suspicious"]:
        imbalance_score = 0.5
        reasons.append(
            f"Moderate phase energy imbalance ({imbalance:.3f} >= "
            f"{RULE_THRESHOLDS['imbalance_suspicious']:.2f} - prototype threshold)"
        )

    # ── Rule 2: Relative energy spread ───────────────────────────────────────
    # Large difference between max and min phase energy, relative to total.
    # Phase-agnostic: triggers regardless of which phase dominates.
    # Prototype threshold — requires field validation
    if relative_spread >= RULE_THRESHOLDS["spread_hif"]:
        spread_score = 1.0
        reasons.append(
            f"High relative energy spread ({relative_spread:.3f} >= "
            f"{RULE_THRESHOLDS['spread_hif']:.2f} - prototype threshold)"
        )
    elif relative_spread >= RULE_THRESHOLDS["spread_suspicious"]:
        spread_score = 0.5
        reasons.append(
            f"Moderate relative energy spread ({relative_spread:.3f} >= "
            f"{RULE_THRESHOLDS['spread_suspicious']:.2f} - prototype threshold)"
        )

    # ── Composite score (0–100) ───────────────────────────────────────────────
    w_i = RULE_THRESHOLDS["weight_imbalance"]
    w_s = RULE_THRESHOLDS["weight_spread"]
    raw_score = w_i * imbalance_score + w_s * spread_score
    score = round(raw_score * 100.0, 1)

    # ── Classification decision ───────────────────────────────────────────────
    if score >= 70.0:
        classification = CLASSIFICATION_POSSIBLE_HIF
    elif score >= 30.0:
        classification = CLASSIFICATION_SUSPICIOUS
    else:
        classification = CLASSIFICATION_NORMAL
        if not reasons:
            reasons.append("No significant energy imbalance or spread detected.")

    return {
        "classification": classification,
        "score": score,
        "reasons": reasons,
        "features_used": {
            "energy_imbalance":  round(imbalance, 6),
            "relative_spread":   round(relative_spread, 6),
            "energy_spread":     round(spread, 2),
            "total_energy":      round(total, 2),
            "max_energy":        round(max_e, 2),
            "min_energy":        round(min_e, 2),
        },
    }


def classify_dataframe(feature_df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply the rule engine to every row of a feature DataFrame.
    Returns the input DataFrame with added columns:
      rule_classification, rule_score, rule_reasons
    """
    results = feature_df.apply(classify_sample, axis=1)
    out = feature_df.copy()
    out["rule_classification"] = results.apply(lambda r: r["classification"])
    out["rule_score"]          = results.apply(lambda r: r["score"])
    out["rule_reasons"]        = results.apply(lambda r: "; ".join(r["reasons"]))
    return out


def evaluate_rule_engine(
    feature_df: pd.DataFrame,
    true_labels_binary: pd.Series,
) -> Dict:
    """
    Evaluate the rule engine as a binary classifier.

    Parameters
    ----------
    feature_df : pd.DataFrame
        Must contain columns used by classify_sample().
    true_labels_binary : pd.Series
        'HIF' or 'NON_HIF' for each row.

    Returns
    -------
    dict with: accuracy, precision, recall, f1, confusion details
    """
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score,
        f1_score, confusion_matrix,
    )

    annotated = classify_dataframe(feature_df)
    # Treat POSSIBLE_HIF as positive HIF prediction
    pred_binary = annotated["rule_classification"].apply(
        lambda c: "HIF" if c == CLASSIFICATION_POSSIBLE_HIF else "NON_HIF"
    )

    y_true = true_labels_binary.values
    y_pred = pred_binary.values

    acc  = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, pos_label="HIF", zero_division=0)
    rec  = recall_score(y_true, y_pred, pos_label="HIF", zero_division=0)
    f1   = f1_score(y_true, y_pred, pos_label="HIF", zero_division=0)
    cm   = confusion_matrix(y_true, y_pred, labels=["HIF", "NON_HIF"])

    return {
        "accuracy":  round(acc,  4),
        "precision": round(prec, 4),
        "recall":    round(rec,  4),
        "f1":        round(f1,   4),
        "confusion_matrix": cm.tolist(),
        "classification_counts": annotated["rule_classification"].value_counts().to_dict(),
    }


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    from ml.preprocessing import run_preprocessing_pipeline
    from ml.feature_extraction import extract_features
    from ml.config import BINARY_TARGET_COLUMN

    df = run_preprocessing_pipeline(save=False)
    features = extract_features(df)

    print("\n" + "-" * 60)
    print("RULE ENGINE - Sample Classifications")
    print("-" * 60)
    annotated = classify_dataframe(features)
    print(annotated[["rule_classification", "rule_score"]].value_counts())

    # If labels available, evaluate
    if BINARY_TARGET_COLUMN in df.columns:
        metrics = evaluate_rule_engine(features, df[BINARY_TARGET_COLUMN])
        print("\nRule engine binary evaluation (POSSIBLE_HIF <-> HIF):")
        for k, v in metrics.items():
            if k != "confusion_matrix":
                print(f"  {k}: {v}")
        print(f"  Confusion matrix (HIF vs NON_HIF):")
        print(f"    {metrics['confusion_matrix']}")

    # Show a sample classification in detail
    print("\nSample rule classification (first HIF row):")
    hif_mask = df["Class"] == "HIF"
    if hif_mask.any():
        first_hif = features[hif_mask].iloc[0]
        result = classify_sample(first_hif)
        for k, v in result.items():
            print(f"  {k}: {v}")
