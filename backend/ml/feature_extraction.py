"""
GridSenti — ml/feature_extraction.py
======================================
Derives additional features from the original DWT energy features EA, EB, EC.

Clearly distinguishes:
  ORIGINAL DATASET FEATURES  — EA, EB, EC (provided by dataset authors)
  OUR DERIVED FEATURES       — computed here from EA/EB/EC

The baseline prototype uses publicly available DWT energy features extracted
from simulated three-phase current signals.  GridSenti does NOT perform DWT
on raw sensor waveforms in this prototype.

All derived features use safe epsilon-guarded arithmetic.
All outputs are validated for NaN/Inf before returning.
"""

from __future__ import annotations

import sys
import warnings
from pathlib import Path
from typing import List

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.config import (
    ORIGINAL_FEATURES,
    DERIVED_FEATURES,
    ALL_FEATURES,
    EPSILON,
    PROCESSED_CSV_PATH,
)


# ── Public API ────────────────────────────────────────────────────────────────

def extract_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Given a DataFrame containing at minimum columns EA, EB, EC, compute all
    derived features and return a DataFrame with ALL_FEATURES columns.

    Parameters
    ----------
    df : pd.DataFrame
        Must contain columns: EA, EB, EC.

    Returns
    -------
    pd.DataFrame
        Columns = ALL_FEATURES = ORIGINAL_FEATURES + DERIVED_FEATURES
        NaN / Inf checked before returning.
    """
    df = df.copy()

    ea = df["EA"].values.astype(float)
    eb = df["EB"].values.astype(float)
    ec = df["EC"].values.astype(float)

    # ── Energy aggregate features ─────────────────────────────────────────────
    # Phase-agnostic: no assumption about which phase dominates for HIF
    total  = ea + eb + ec                            # total DWT energy
    mean_e = total / 3.0                             # mean energy per phase
    max_e  = np.maximum(np.maximum(ea, eb), ec)      # maximum phase energy
    min_e  = np.minimum(np.minimum(ea, eb), ec)      # minimum phase energy
    spread = max_e - min_e                           # energy spread (range)

    # Normalised imbalance: std([EA,EB,EC]) / (mean + ε)
    # This is phase-agnostic and captures asymmetry regardless of which phase
    # deviates.  Epsilon prevents division-by-zero for all-zero rows.
    phase_stack = np.stack([ea, eb, ec], axis=1)    # (N, 3)
    phase_std   = np.std(phase_stack, axis=1)
    imbalance   = phase_std / (mean_e + EPSILON)

    df["total_energy"]   = total
    df["mean_energy"]    = mean_e
    df["max_energy"]     = max_e
    df["min_energy"]     = min_e
    df["energy_spread"]  = spread
    df["energy_imbalance"] = imbalance

    # ── Log-transformed original features ────────────────────────────────────
    # Log scale compresses the large dynamic range of DWT energies and helps
    # tree-based models partition the feature space more evenly.
    # clip(min=EPSILON) ensures log is defined for any non-negative value.
    df["log_EA"] = np.log(np.clip(ea, EPSILON, None))
    df["log_EB"] = np.log(np.clip(eb, EPSILON, None))
    df["log_EC"] = np.log(np.clip(ec, EPSILON, None))

    # ── Safe inter-phase log-ratios ───────────────────────────────────────────
    # log(EA/EB) = log_EA - log_EB  — mathematically identical but numerically
    # explicit.  Bounded: if both are EPSILON, result is 0 (neutral).
    # Physically: captures *relative* phase balance, not absolute magnitudes.
    log_ea = df["log_EA"].values
    log_eb = df["log_EB"].values
    log_ec = df["log_EC"].values

    df["log_ratio_EA_EB"] = log_ea - log_eb
    df["log_ratio_EA_EC"] = log_ea - log_ec
    df["log_ratio_EB_EC"] = log_eb - log_ec

    # ── Validate: check for NaN / Inf ─────────────────────────────────────────
    feature_df = df[ALL_FEATURES].copy()
    _validate_features(feature_df)

    return feature_df


def get_feature_names() -> List[str]:
    """Return the ordered list of all feature names used for model training."""
    return list(ALL_FEATURES)


def validate_feature_vector(vec: dict | pd.Series) -> None:
    """
    Validate a single inference-time feature vector.
    Raises ValueError if any feature is NaN or Inf.
    """
    for name in ALL_FEATURES:
        val = vec[name]
        if np.isnan(val) or np.isinf(val):
            raise ValueError(
                f"Feature '{name}' is {val}. Cannot run inference with "
                "NaN or Inf inputs."
            )


# ── CLI entry point ───────────────────────────────────────────────────────────

def _validate_features(feature_df: pd.DataFrame) -> None:
    """
    Internal validation: warn (and raise if critical) on NaN / Inf features.
    """
    has_nan = feature_df.isnull().any()
    has_inf = feature_df.isin([np.inf, -np.inf]).any()

    bad_cols = []
    for col in feature_df.columns:
        if has_nan[col] or has_inf[col]:
            bad_cols.append(col)

    if bad_cols:
        raise ValueError(
            f"Features contain NaN or Inf after extraction: {bad_cols}\n"
            "Check input data for zero or negative energy values."
        )


if __name__ == "__main__":
    from ml.preprocessing import run_preprocessing_pipeline

    df = run_preprocessing_pipeline(save=False)
    features = extract_features(df)

    print("\n" + "-" * 60)
    print("FEATURE EXTRACTION REPORT")
    print("-" * 60)
    print(f"  Total features : {len(ALL_FEATURES)}")
    print(f"  Original       : {ORIGINAL_FEATURES}")
    print(f"  Derived        : {DERIVED_FEATURES}")
    print(f"  Sample shape   : {features.shape}")
    print("\nFeature statistics:")
    print(features.describe().T.to_string())
    print("\nFirst 3 rows:")
    print(features.head(3).to_string())
    print("\n[OK] All features passed NaN/Inf validation.")
