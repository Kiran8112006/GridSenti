"""
GridSenti — ml/model_utils.py
==============================
Utilities for saving and loading the trained Random Forest model,
feature list, and label encoder.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.config import (
    MODEL_PATH,
    FEATURE_LIST_PATH,
    LABEL_ENCODER_PATH,
    MODELS_DIR,
)


# ── Save ──────────────────────────────────────────────────────────────────────

def save_model(model, feature_names: List[str], label_encoder=None) -> None:
    """
    Persist:
      - the trained sklearn model (joblib)
      - the feature list (plain-text, one per line)
      - optionally a LabelEncoder (joblib)
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, MODEL_PATH)
    print(f"[save_model] Model saved -> {MODEL_PATH}")

    FEATURE_LIST_PATH.write_text("\n".join(feature_names), encoding="utf-8")
    print(f"[save_model] Feature list saved -> {FEATURE_LIST_PATH}")

    if label_encoder is not None:
        joblib.dump(label_encoder, LABEL_ENCODER_PATH)
        print(f"[save_model] Label encoder saved -> {LABEL_ENCODER_PATH}")


# ── Load ──────────────────────────────────────────────────────────────────────

def load_model():
    """Load the trained model from disk. Raises FileNotFoundError if missing."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"No trained model found at {MODEL_PATH}.\n"
            "Run  python -m ml.train  first."
        )
    model = joblib.load(MODEL_PATH)
    return model


def load_feature_names() -> List[str]:
    """Load the ordered feature list used during training."""
    if not FEATURE_LIST_PATH.exists():
        raise FileNotFoundError(
            f"Feature list not found at {FEATURE_LIST_PATH}.\n"
            "Run  python -m ml.train  first."
        )
    names = FEATURE_LIST_PATH.read_text(encoding="utf-8").strip().splitlines()
    return names


def load_label_encoder():
    """Load the LabelEncoder if it was saved."""
    if not LABEL_ENCODER_PATH.exists():
        return None
    return joblib.load(LABEL_ENCODER_PATH)


# ── Validation ────────────────────────────────────────────────────────────────

def check_model_artifacts_exist() -> bool:
    """Return True if all model artifacts are present on disk."""
    return MODEL_PATH.exists() and FEATURE_LIST_PATH.exists()


def get_model_info() -> dict:
    """Return a summary dict about the saved model artefacts."""
    info = {
        "model_path": str(MODEL_PATH),
        "feature_list_path": str(FEATURE_LIST_PATH),
        "model_exists": MODEL_PATH.exists(),
        "feature_list_exists": FEATURE_LIST_PATH.exists(),
    }
    if MODEL_PATH.exists():
        info["model_size_bytes"] = MODEL_PATH.stat().st_size
    if FEATURE_LIST_PATH.exists():
        info["n_features"] = len(load_feature_names())
    return info
