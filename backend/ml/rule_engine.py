"""
GridSenti — ml/rule_engine.py
==============================
Prototype rule-based HIF detection baseline.

PURPOSE
-------
This rule engine is a research/prototype baseline.
It provides an explainable pre-ML filter and benchmark based on phase-agnostic
characteristic shifts in DWT energy features.

CALIBRATION
-----------
Calibrated against the public Mendeley Fault Dataset (DOI: 10.17632/rvypj5rs5b.1).
In steady-state normal operation, phase current/DWT energy distribution has a
characteristic baseline imbalance (~0.760) and relative spread (~0.601).
HIFs and line faults cause a phase energy distribution shift (asymmetry anomaly)
and total energy elevation.

OUTPUT
------
Returns a dict:
  {
      "classification": "NORMAL" | "SUSPICIOUS" | "POSSIBLE_HIF",
      "score": float (0–100),
      "reasons": [str, ...],
      "features_used": {str: float, ...}
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
CLASSIFICATION_NORMAL       = "NORMAL"
CLASSIFICATION_SUSPICIOUS   = "SUSPICIOUS"
CLASSIFICATION_POSSIBLE_HIF = "POSSIBLE_HIF"


# ── Public API ────────────────────────────────────────────────────────────────

def classify_sample(features: Union[dict, pd.Series]) -> Dict:
    """
    Apply phase-agnostic dataset-calibrated rule engine to a feature vector.

    Parameters
    ----------
    features : dict or pd.Series
        Must contain: energy_imbalance, energy_spread, total_energy, max_energy, min_energy

    Returns
    -------
    dict with: classification, score, reasons, features_used
    """
    imbalance = float(features.get("energy_imbalance", 0.0))
    spread    = float(features.get("energy_spread", 0.0))
    total     = float(features.get("total_energy", 1.0))
    max_e     = float(features.get("max_energy", 0.0))
    min_e     = float(features.get("min_energy", 0.0))

    relative_spread = spread / (total + EPSILON)

    # Calculate shifts relative to steady-state normal baselines
    norm_imb_base    = RULE_THRESHOLDS["norm_imbalance_baseline"]
    norm_spread_base = RULE_THRESHOLDS["norm_spread_baseline"]
    norm_total_base  = RULE_THRESHOLDS["norm_total_baseline"]

    imbalance_dev = abs(imbalance - norm_imb_base)
    spread_dev    = abs(relative_spread - norm_spread_base)
    energy_elev   = (total - norm_total_base) / (norm_total_base + EPSILON)

    reasons: List[str] = []
    score = 0.0

    # ── Rule 1: Phase Imbalance Shift Anomaly ─────────────────────────────────
    if imbalance_dev >= RULE_THRESHOLDS["imbalance_dev_hif"]:
        score += 40.0
        reasons.append(
            f"Severe phase imbalance shift ({imbalance_dev:.3f} >= "
            f"{RULE_THRESHOLDS['imbalance_dev_hif']:.2f} - prototype threshold)"
        )
    elif imbalance_dev >= RULE_THRESHOLDS["imbalance_dev_suspicious"]:
        score += 20.0
        reasons.append(
            f"Moderate phase imbalance shift ({imbalance_dev:.3f} >= "
            f"{RULE_THRESHOLDS['imbalance_dev_suspicious']:.2f} - prototype threshold)"
        )

    # ── Rule 2: Relative Energy Spread Shift Anomaly ─────────────────────────
    if spread_dev >= RULE_THRESHOLDS["spread_dev_hif"]:
        score += 40.0
        reasons.append(
            f"Severe relative energy spread shift ({spread_dev:.3f} >= "
            f"{RULE_THRESHOLDS['spread_dev_hif']:.2f} - prototype threshold)"
        )
    elif spread_dev >= RULE_THRESHOLDS["spread_dev_suspicious"]:
        score += 20.0
        reasons.append(
            f"Moderate relative energy spread shift ({spread_dev:.3f} >= "
            f"{RULE_THRESHOLDS['spread_dev_suspicious']:.2f} - prototype threshold)"
        )

    # ── Rule 3: Total Energy Elevation ────────────────────────────────────────
    if energy_elev >= RULE_THRESHOLDS["total_elevation_hif"]:
        score += 20.0
        reasons.append(
            f"Elevated total DWT energy ({energy_elev*100.0:.1f}% above baseline)"
        )
    elif energy_elev >= RULE_THRESHOLDS["total_elevation_suspicious"]:
        score += 10.0
        reasons.append(
            f"Slight total DWT energy elevation ({energy_elev*100.0:.1f}% above baseline)"
        )

    # Score bounds [0, 100]
    score = min(100.0, score)

    # ── Classification Decision ───────────────────────────────────────────────
    if score >= 60.0:
        classification = CLASSIFICATION_POSSIBLE_HIF
    elif score >= 20.0:
        classification = CLASSIFICATION_SUSPICIOUS
    else:
        classification = CLASSIFICATION_NORMAL
        if not reasons:
            reasons.append("No significant energy imbalance shift or spread anomaly detected.")

    return {
        "classification": classification,
        "score": score,
        "reasons": reasons,
        "features_used": {
            "energy_imbalance":     round(imbalance, 6),
            "imbalance_deviation":  round(imbalance_dev, 6),
            "relative_spread":      round(relative_spread, 6),
            "spread_deviation":     round(spread_dev, 6),
            "total_energy":         round(total, 2),
            "energy_elevation_pct": round(energy_elev * 100.0, 2),
        },
    }


def classify_dataframe(feature_df: pd.DataFrame) -> pd.DataFrame:
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
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score,
        f1_score, confusion_matrix,
    )

    annotated = classify_dataframe(feature_df)
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
