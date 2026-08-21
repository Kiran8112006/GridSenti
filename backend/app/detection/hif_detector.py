"""
GridSenti — app/detection/hif_detector.py
==========================================
Application-facing HIF detection layer.

This module is the bridge between:
  FastAPI routes  →  app/detection/hif_detector.py  →  ml/predict.py

No ML logic lives here.  All ML logic lives in ml/.
This module wraps ml.predict for use by the FastAPI application.

Architecture:
  app/
  └── detection/
        └── hif_detector.py   ← (this file)
              ↓
           ml/predict.py
              ↓
        Feature extraction + Rule engine + RandomForest
              ↓
        Detection result
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Dict, Optional

# Ensure ml/ is importable from this location
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_BACKEND_DIR))


def detect_hif(ea: float, eb: float, ec: float) -> Dict:
    """
    Application entry point for HIF detection.

    Accepts the three DWT energy features EA, EB, EC as returned by an edge
    sensor node, and returns a structured detection result.

    Parameters
    ----------
    ea, eb, ec : float
        DWT energy features for phases A, B, C respectively.

    Returns
    -------
    dict with:
        classification    : "HIF" | "NON_HIF" | None (if model not loaded)
        model_probability : {"HIF": float, "NON_HIF": float}
        rule_engine       : rule engine output
        features_used     : derived feature values
        model_loaded      : bool
        error             : str (present only on failure)
    """
    try:
        from ml.predict import predict_hif
        return predict_hif(ea=ea, eb=eb, ec=ec)
    except ImportError as exc:
        return {
            "classification": None,
            "model_probability": None,
            "rule_engine": None,
            "features_used": None,
            "model_loaded": False,
            "error": (
                f"ML module import failed: {exc}. "
                "Run 'python -m ml.train' to train the model first."
            ),
        }


def get_model_status() -> Dict:
    """
    Return the status of the ML model artefacts.
    Safe to call even if model has not been trained yet.
    """
    try:
        from ml.model_utils import get_model_info, check_model_artifacts_exist
        return {
            "ready": check_model_artifacts_exist(),
            **get_model_info(),
        }
    except Exception as exc:
        return {"ready": False, "error": str(exc)}
