"""
GridSenti — ml/preprocessing.py
=================================
Dataset loading, inspection, duplicate analysis, cleaning, and label encoding.

Dataset source:
  Vinayagam, A. (2025). Fault data set. Mendeley Data, V1.
  https://doi.org/10.17632/rvypj5rs5b.1

Important notes:
  - This dataset contains PRE-EXTRACTED DWT energy features (EA, EB, EC).
    GridSenti does NOT perform DWT on raw waveforms at this stage.
  - The baseline prototype consumes publicly available DWT energy features
    extracted from simulated three-phase current signals by the original authors.
"""

from __future__ import annotations

import sys
import textwrap
from pathlib import Path
from typing import Tuple

import numpy as np
import pandas as pd

# Allow running as  python -m ml.preprocessing  from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.config import (
    RAW_CSV_PATH,
    PROCESSED_CSV_PATH,
    ORIGINAL_FEATURES,
    TARGET_COLUMN,
    HIF_CLASS_LABEL,
    BINARY_TARGET_COLUMN,
    ALL_CLASSES,
    PROCESSED_DIR,
)


# ── Public API ────────────────────────────────────────────────────────────────

def load_dataset(csv_path: Path = RAW_CSV_PATH) -> pd.DataFrame:
    """Load raw CSV and validate expected columns exist."""
    if not csv_path.exists():
        raise FileNotFoundError(
            f"Dataset not found at: {csv_path}\n"
            "Download from: https://doi.org/10.17632/rvypj5rs5b.1\n"
            "Place as: backend/data/raw/Fault_dataset.csv"
        )
    df = pd.read_csv(csv_path)
    expected = {TARGET_COLUMN} | set(ORIGINAL_FEATURES)
    missing = expected - set(df.columns)
    if missing:
        raise ValueError(f"Expected columns missing from dataset: {missing}")
    return df


def inspect_dataset(df: pd.DataFrame) -> dict:
    """
    Thoroughly inspect the dataset and return a structured report dict.
    Also prints a human-readable summary to stdout.
    """
    report: dict = {}

    # ── Basic shape ──────────────────────────────────────────────────────────
    report["shape"] = df.shape
    report["columns"] = df.columns.tolist()

    # ── Class distribution ────────────────────────────────────────────────────
    class_counts = df[TARGET_COLUMN].value_counts().to_dict()
    report["class_distribution"] = class_counts
    report["n_classes"] = df[TARGET_COLUMN].nunique()
    report["classes_found"] = sorted(df[TARGET_COLUMN].unique().tolist())

    # ── Missing values ────────────────────────────────────────────────────────
    null_counts = df.isnull().sum().to_dict()
    report["null_counts"] = null_counts
    report["has_nulls"] = any(v > 0 for v in null_counts.values())

    # ── Numeric stats ─────────────────────────────────────────────────────────
    numeric_cols = ORIGINAL_FEATURES
    report["feature_stats"] = df[numeric_cols].describe().to_dict()

    # ── Duplicate analysis ────────────────────────────────────────────────────
    # Exact duplicate rows (including Class column)
    n_exact_dups = int(df.duplicated().sum())

    # Feature-only duplicates (same EA/EB/EC but potentially different Class)
    n_feature_dups = int(df.duplicated(subset=ORIGINAL_FEATURES).sum())

    # Counts of unique feature vectors per class
    unique_per_class = (
        df.groupby(TARGET_COLUMN)[ORIGINAL_FEATURES]
        .apply(lambda g: g.drop_duplicates().shape[0])
        .to_dict()
    )

    # Count how many rows are truly unique vs repeated
    feature_value_counts = (
        df[ORIGINAL_FEATURES]
        .apply(lambda col: col.astype(str))
        .agg("-".join, axis=1)
        .value_counts()
    )
    n_repeated_vectors = int((feature_value_counts > 1).sum())

    report["duplicate_analysis"] = {
        "exact_duplicate_rows": n_exact_dups,
        "feature_only_duplicates": n_feature_dups,
        "unique_feature_vectors_per_class": unique_per_class,
        "repeated_feature_vectors": n_repeated_vectors,
        "leakage_warning": (
            "No event/group identifier exists in this dataset. "
            "Samples within each class may represent repeated simulations of "
            "the same fault condition. Event-level train/test separation "
            "CANNOT be guaranteed. This limits how generalisable the "
            "measured accuracy is to unseen real-world conditions."
        ),
    }

    # ── Class-block structure ─────────────────────────────────────────────────
    # Check whether rows of the same class are contiguous (block structure)
    class_runs = []
    prev = None
    run_start = 0
    for i, cls in enumerate(df[TARGET_COLUMN]):
        if cls != prev:
            if prev is not None:
                class_runs.append({"class": prev, "start": run_start, "end": i - 1, "length": i - run_start})
            prev = cls
            run_start = i
    class_runs.append({"class": prev, "start": run_start, "end": len(df) - 1, "length": len(df) - run_start})
    report["class_block_structure"] = class_runs

    # ── Print summary ─────────────────────────────────────────────────────────
    _print_inspection_report(report)

    return report


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean the dataset:
    - Drop rows with any NaN in feature or target columns
    - Validate all feature values are positive (DWT energies must be ≥ 0)
    - Report any anomalies but do not silently drop them
    """
    initial_rows = len(df)

    # Drop rows with NaN in required columns
    required = [TARGET_COLUMN] + ORIGINAL_FEATURES
    df_clean = df[required].dropna()
    dropped_nan = initial_rows - len(df_clean)
    if dropped_nan > 0:
        print(f"[WARNING] Dropped {dropped_nan} rows with NaN values.")

    # Check for non-positive energy values (physically unexpected for DWT energy)
    for col in ORIGINAL_FEATURES:
        n_nonpos = int((df_clean[col] <= 0).sum())
        if n_nonpos > 0:
            print(f"[WARNING] {n_nonpos} rows have {col} <= 0. DWT energies "
                  "should be non-negative; these rows may be anomalous.")

    # Validate that all expected class labels are present or warn about extras
    found_classes = set(df_clean[TARGET_COLUMN].unique())
    unexpected = found_classes - set(ALL_CLASSES)
    if unexpected:
        print(f"[WARNING] Unexpected class labels found: {unexpected}")

    print(f"[clean_dataset] {len(df_clean)} rows retained from {initial_rows}.")
    return df_clean.reset_index(drop=True)


def prepare_labels(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add binary and numeric label columns.

    Returns a copy of df with:
      - 'label_binary':  'HIF' | 'NON_HIF'
      - 'label_multiclass_encoded': integer code for multi-class models
    """
    df = df.copy()

    # Binary label: HIF vs everything else
    df[BINARY_TARGET_COLUMN] = df[TARGET_COLUMN].apply(
        lambda c: HIF_CLASS_LABEL if c == HIF_CLASS_LABEL else "NON_HIF"
    )

    # Integer encoding for multiclass (sorted alphabetically for reproducibility)
    classes_sorted = sorted(df[TARGET_COLUMN].unique())
    label_map = {cls: i for i, cls in enumerate(classes_sorted)}
    df["label_multiclass_encoded"] = df[TARGET_COLUMN].map(label_map)
    df["label_binary_encoded"] = (df[TARGET_COLUMN] == HIF_CLASS_LABEL).astype(int)

    return df


def run_preprocessing_pipeline(save: bool = True) -> pd.DataFrame:
    """
    Full preprocessing pipeline:
      load -> inspect -> clean -> label -> (optionally save)

    Returns the processed DataFrame.
    """
    print("=" * 60)
    print("GridSenti — HIF Detection Preprocessing Pipeline")
    print("=" * 60)

    df_raw = load_dataset()
    inspect_dataset(df_raw)
    df_clean = clean_dataset(df_raw)
    df_labelled = prepare_labels(df_clean)

    if save:
        PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        df_labelled.to_csv(PROCESSED_CSV_PATH, index=False)
        print(f"\n[Saved] Processed dataset -> {PROCESSED_CSV_PATH}")

    return df_labelled


# ── Internal helpers ──────────────────────────────────────────────────────────

def _print_inspection_report(report: dict) -> None:
    sep = "-" * 60
    print(f"\n{sep}")
    print("DATASET INSPECTION REPORT")
    print(sep)
    print(f"  Rows x Columns : {report['shape']}")
    print(f"  Columns        : {report['columns']}")
    print(f"  Classes found  : {report['n_classes']} -> {report['classes_found']}")
    print(f"  Missing values : {'YES - see details' if report['has_nulls'] else 'None'}")

    print(f"\n  Class distribution:")
    for cls, count in sorted(report["class_distribution"].items()):
        bar = "#" * min(count, 40)
        print(f"    {cls:8s}  {count:4d}  {bar}")

    da = report["duplicate_analysis"]
    print(f"\n  Duplicate analysis:")
    print(f"    Exact duplicate rows         : {da['exact_duplicate_rows']}")
    print(f"    Feature-only duplicates      : {da['feature_only_duplicates']}")
    print(f"    Unique vectors repeated >1x  : {da['repeated_feature_vectors']}")
    print(f"    Unique feature vectors/class :")
    for cls, n in da["unique_feature_vectors_per_class"].items():
        print(f"      {cls:8s}: {n}")

    print(f"\n  Class-block structure (contiguous runs):")
    for blk in report["class_block_structure"]:
        print(f"    rows {blk['start']:3d}-{blk['end']:3d}  len={blk['length']:3d}  class={blk['class']}")

    print(f"\n  [!] Leakage note:")
    print(textwrap.fill(da["leakage_warning"], width=72, initial_indent="     ",
                        subsequent_indent="     "))
    print(sep)


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    df = run_preprocessing_pipeline(save=True)
    print(f"\nFinal processed shape: {df.shape}")
    print(df.head())
