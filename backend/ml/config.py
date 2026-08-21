"""
GridSenti — ml/config.py
========================
Central configuration for the HIF detection ML pipeline.

All paths, hyperparameters, and prototype thresholds are defined here
so that every other module imports from a single source of truth.
"""

from pathlib import Path

# ── Directory layout ────────────────────────────────────────────────────────
# Base is the backend/ directory (one level above ml/)
_BACKEND_DIR = Path(__file__).resolve().parent.parent

DATA_DIR       = _BACKEND_DIR / "data"
RAW_DATA_DIR   = DATA_DIR / "raw"
PROCESSED_DIR  = DATA_DIR / "processed"
MODELS_DIR     = _BACKEND_DIR / "models"
REPORTS_DIR    = _BACKEND_DIR / "reports"

# ── Dataset ──────────────────────────────────────────────────────────────────
RAW_CSV_PATH        = RAW_DATA_DIR / "Fault_dataset.csv"
PROCESSED_CSV_PATH  = PROCESSED_DIR / "processed_dataset.csv"

# ── Dataset metadata (from Mendeley DOI 10.17632/rvypj5rs5b.1) ──────────────
DATASET_CITATION = (
    "Vinayagam, A. (2025). Fault data set. Mendeley Data, V1. "
    "https://doi.org/10.17632/rvypj5rs5b.1"
)

ORIGINAL_FEATURES = ["EA", "EB", "EC"]
"""
ORIGINAL_FEATURES are DWT energy features extracted by the original dataset
authors from simulated three-phase microgrid current signals using
MATLAB/Simulink.  GridSenti does NOT perform DWT on raw waveforms; it
consumes these pre-extracted features.
"""

TARGET_COLUMN = "Class"

# All class labels present in the dataset
ALL_CLASSES = ["Normal", "LG", "LLG", "LLLG", "LL", "HIF", "CS", "LS"]

# Binary target: HIF vs everything else
HIF_CLASS_LABEL  = "HIF"
NON_HIF_LABEL    = "NON_HIF"
BINARY_TARGET_COLUMN = "label_binary"

# ── Derived feature names ─────────────────────────────────────────────────────
DERIVED_FEATURES = [
    "total_energy",
    "mean_energy",
    "max_energy",
    "min_energy",
    "energy_spread",
    "energy_imbalance",
    "log_EA",
    "log_EB",
    "log_EC",
    "log_ratio_EA_EB",   # log(EA / EB) — numerically stable
    "log_ratio_EA_EC",   # log(EA / EC)
    "log_ratio_EB_EC",   # log(EB / EC)
]

ALL_FEATURES = ORIGINAL_FEATURES + DERIVED_FEATURES

# ── Model paths ───────────────────────────────────────────────────────────────
MODEL_PATH       = MODELS_DIR / "hif_random_forest.joblib"
FEATURE_LIST_PATH = MODELS_DIR / "feature_list.txt"
LABEL_ENCODER_PATH = MODELS_DIR / "label_encoder.joblib"

# ── Random Forest hyperparameters ─────────────────────────────────────────────
RF_PARAMS = {
    "n_estimators": 200,
    "max_depth": None,          # unlimited — dataset is small, regularise via CV
    "min_samples_split": 2,
    "min_samples_leaf": 1,
    "class_weight": "balanced", # guard against HIF under-representation
    "random_state": 42,
    "n_jobs": -1,
}

CV_FOLDS = 5       # stratified k-fold cross-validation
TEST_SIZE = 0.20   # for the holdout split (visualisation only — not definitive)
RANDOM_STATE = 42

# ── Rule engine thresholds ────────────────────────────────────────────────────
# PROTOTYPE THRESHOLDS — require field/utility validation before production use.
# All thresholds are relative or percentile-based so they do not hard-code
# physical unit assumptions.
RULE_THRESHOLDS = {
    # Imbalance: normalised std/mean of [EA, EB, EC].
    # High imbalance is a necessary (but not sufficient) condition for HIF.
    "imbalance_suspicious": 0.10,   # prototype threshold
    "imbalance_hif":        0.25,   # prototype threshold

    # Energy spread: max_energy - min_energy relative to total_energy.
    "spread_suspicious": 0.15,      # prototype threshold
    "spread_hif":        0.35,      # prototype threshold

    # Score weights (all sum to 1.0)
    "weight_imbalance": 0.50,
    "weight_spread":    0.50,
}

# ── Reporting ─────────────────────────────────────────────────────────────────
CONFUSION_MATRIX_PATH   = REPORTS_DIR / "confusion_matrix.png"
FEATURE_IMP_PNG_PATH    = REPORTS_DIR / "feature_importance.png"
FEATURE_IMP_CSV_PATH    = REPORTS_DIR / "feature_importance.csv"
CLASSIFICATION_RPT_PATH = REPORTS_DIR / "classification_report.txt"
EXPERIMENT_SUMMARY_PATH = REPORTS_DIR / "experiment_summary.md"

# ── Numerical safety ──────────────────────────────────────────────────────────
EPSILON = 1e-9   # added to denominators to prevent division-by-zero
