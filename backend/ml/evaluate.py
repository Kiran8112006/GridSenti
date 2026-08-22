"""
GridSenti — ml/evaluate.py
===========================
Generates evaluation artefacts from the trained model:
  - classification_report.txt
  - confusion_matrix.png
  - feature_importance.csv
  - feature_importance.png
  - experiment_summary.md

IMPORTANT: This module uses ACTUAL results only.
No metrics are fabricated, rounded up, or improved post-hoc.
If the model performs poorly, that is reported as-is.
"""

from __future__ import annotations

import sys
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

import joblib
import matplotlib
matplotlib.use("Agg")  # headless backend
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
)

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.config import (
    REPORTS_DIR,
    CONFUSION_MATRIX_PATH,
    FEATURE_IMP_PNG_PATH,
    FEATURE_IMP_CSV_PATH,
    CLASSIFICATION_RPT_PATH,
    EXPERIMENT_SUMMARY_PATH,
    HIF_CLASS_LABEL,
    DATASET_CITATION,
    ORIGINAL_FEATURES,
    DERIVED_FEATURES,
    ALL_FEATURES,
    RF_PARAMS,
    RULE_THRESHOLDS,
    CV_FOLDS,
)


# ── Public API ────────────────────────────────────────────────────────────────

def generate_all_reports(train_results: dict) -> None:
    """
    Generate all evaluation artefacts from train_results dict
    (as returned by ml.train.run_training()).
    """
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    cv       = train_results["cv_metrics"]
    holdout  = train_results["holdout_metrics"]
    model    = train_results["model"]
    importances = train_results["feature_importances"]
    y_test   = holdout["holdout_y_test"]
    y_pred   = holdout["holdout_y_pred"]
    labels   = holdout["holdout_labels"]

    _save_classification_report(y_test, y_pred, cv)
    _save_confusion_matrix(y_test, y_pred, labels)
    _save_feature_importance(importances)
    _save_experiment_summary(train_results)

    print(f"\n[OK] All evaluation reports saved to: {REPORTS_DIR}")


# ── Private helpers ───────────────────────────────────────────────────────────

def _save_classification_report(y_test, y_pred, cv_metrics: dict) -> None:
    report = classification_report(
        y_test, y_pred, labels=[HIF_CLASS_LABEL, "NON_HIF"],
        zero_division=0,
    )
    header = (
        "GridSenti - HIF Detection Baseline: Classification Report\n"
        f"Generated: {datetime.now().isoformat()}\n"
        "=" * 60 + "\n\n"
        "NOTE: Holdout split (80/20) shown below is for illustration.\n"
        f"      Definitive metric = {CV_FOLDS}-Fold Stratified CV.\n\n"
        "Cross-Validation Results (primary):\n"
        f"  CV Accuracy    : {cv_metrics['cv_accuracy']:.4f} "
        f"+/- {cv_metrics['cv_accuracy_std']:.4f}\n"
        f"  CV Precision   : {cv_metrics['cv_precision_w']:.4f} (weighted)\n"
        f"  CV Recall      : {cv_metrics['cv_recall_w']:.4f} (weighted)\n"
        f"  CV F1          : {cv_metrics['cv_f1_w']:.4f} (weighted)\n"
        f"  HIF Precision  : {cv_metrics['cv_hif_precision']:.4f}\n"
        f"  HIF Recall     : {cv_metrics['cv_hif_recall']:.4f}  <- safety metric\n"
        f"  HIF F1         : {cv_metrics['cv_hif_f1']:.4f}\n"
        f"\nPer-fold accuracies: "
        f"{[round(a,4) for a in cv_metrics['cv_fold_accuracies']]}\n\n"
        "------------------------------------------------------------\n"
        "Holdout (80/20) Classification Report (illustration only):\n"
        "------------------------------------------------------------\n"
    )
    full_text = header + report
    CLASSIFICATION_RPT_PATH.write_text(full_text, encoding="utf-8")
    print(f"[evaluate] Classification report -> {CLASSIFICATION_RPT_PATH}")


def _save_confusion_matrix(y_test, y_pred, labels) -> None:
    cm = confusion_matrix(y_test, y_pred, labels=labels)

    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(
        cm,
        annot=True, fmt="d",
        xticklabels=labels, yticklabels=labels,
        cmap="Blues",
        linewidths=0.5,
        linecolor="gray",
        ax=ax,
    )
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("True", fontsize=12)
    ax.set_title(
        "GridSenti HIF Detection - Confusion Matrix\n"
        "(Holdout 80/20 split - for visualisation; see CV metrics for primary results)",
        fontsize=9,
        pad=12,
    )
    fig.tight_layout()
    fig.savefig(CONFUSION_MATRIX_PATH, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"[evaluate] Confusion matrix -> {CONFUSION_MATRIX_PATH}")


def _save_feature_importance(importances: dict) -> None:
    imp_series = pd.Series(importances).sort_values(ascending=False)

    # CSV
    imp_df = imp_series.reset_index()
    imp_df.columns = ["feature", "importance"]
    imp_df["rank"] = range(1, len(imp_df) + 1)
    imp_df.to_csv(FEATURE_IMP_CSV_PATH, index=False)
    print(f"[evaluate] Feature importance CSV -> {FEATURE_IMP_CSV_PATH}")

    # PNG
    fig, ax = plt.subplots(figsize=(8, 6))
    colors = ["#1d6fa4" if f in ORIGINAL_FEATURES else "#e07b39"
              for f in imp_series.index]
    bars = ax.barh(imp_series.index[::-1], imp_series.values[::-1], color=colors[::-1])
    ax.set_xlabel("Mean Decrease in Impurity (Gini)", fontsize=11)
    ax.set_title(
        "GridSenti HIF Detection — Random Forest Feature Importance\n"
        "(Blue = original DWT features | Orange = derived features)",
        fontsize=10,
    )
    # Add value labels
    for bar in bars:
        w = bar.get_width()
        ax.text(w + 0.002, bar.get_y() + bar.get_height() / 2,
                f"{w:.4f}", va="center", fontsize=8)

    # Legend
    from matplotlib.patches import Patch
    legend_elements = [
        Patch(facecolor="#1d6fa4", label="Original DWT features (EA, EB, EC)"),
        Patch(facecolor="#e07b39", label="Derived features (GridSenti)"),
    ]
    ax.legend(handles=legend_elements, loc="lower right", fontsize=9)
    fig.tight_layout()
    fig.savefig(FEATURE_IMP_PNG_PATH, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"[evaluate] Feature importance PNG -> {FEATURE_IMP_PNG_PATH}")


def _save_experiment_summary(train_results: dict) -> None:
    cv = train_results["cv_metrics"]
    dup_report = train_results.get("duplicate_report", {})
    n_samples = len(train_results["y_binary"])
    n_hif = int(sum(1 for y in train_results["y_binary"] if y == HIF_CLASS_LABEL))

    # Duplicate info
    dup_info = dup_report.get("duplicate_analysis", {})
    exact_dups = dup_info.get("exact_duplicate_rows", "N/A")
    feat_dups  = dup_info.get("feature_only_duplicates", "N/A")

    # Top-5 feature importances
    imp = sorted(train_results["feature_importances"].items(),
                 key=lambda x: -x[1])
    top5_str = "\n".join(f"  {i+1}. {f:30s} {v:.4f}" for i, (f, v) in enumerate(imp[:5]))

    summary = f"""# GridSenti HIF Detection — Baseline Experiment Summary

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

## Dataset

- **Source:** Mendeley Data — "Fault data set" by Arangarajan Vinayagam
- **DOI:** 10.17632/rvypj5rs5b.1
- **Citation:** {DATASET_CITATION}
- **Total samples:** {n_samples}
- **HIF samples:** {n_hif} ({100*n_hif/n_samples:.1f}%)
- **Features in dataset:** EA, EB, EC (pre-extracted DWT energy features from simulated three-phase current signals in MATLAB/Simulink)

> The baseline prototype uses publicly available DWT energy features extracted
> from simulated three-phase current signals.  GridSenti does NOT perform DWT
> on raw sensor waveforms in this prototype.

## Classes

| Class | Meaning                      |
|-------|------------------------------|
| Normal | No fault                    |
| LG    | Line to ground               |
| LLG   | Line-line to ground          |
| LLLG  | Three-phase to ground        |
| LL    | Line to line                 |
| HIF   | High-impedance fault ← target|
| CS    | Capacitor switching          |
| LS    | Load switching               |

Binary target: **HIF** vs **NON_HIF**

## Duplicate / Leakage Analysis

- Exact duplicate rows: **{exact_dups}**
- Feature-only duplicates: **{feat_dups}**
- No event/group identifier exists in this dataset.
- Samples within each class may represent repeated simulations of the same fault condition.
- **Event-level train/test separation CANNOT be guaranteed.**
- Cross-validation stratifies by class label only.

⚠ Measured accuracy on this dataset does NOT directly reflect real-world generalisability.

## Features

**Original dataset features** (DWT energies from original authors):
- EA — DWT energy, Phase A
- EB — DWT energy, Phase B
- EC — DWT energy, Phase C

**Derived features** (computed by GridSenti):
- total_energy, mean_energy, max_energy, min_energy
- energy_spread (max − min)
- energy_imbalance (std/mean — phase-agnostic)
- log_EA, log_EB, log_EC (log-scale, numerically stable)
- log_ratio_EA_EB, log_ratio_EA_EC, log_ratio_EB_EC (log-domain, safe)

**Total features used:** {len(ALL_FEATURES)}

## Rule Engine

- Phase-agnostic prototype rule baseline
- Uses: energy_imbalance + relative energy_spread
- All thresholds are PROTOTYPE values requiring field/utility validation
- Output: NORMAL / SUSPICIOUS / POSSIBLE_HIF + score (0–100) + reasons

## ML Model

- **Algorithm:** RandomForestClassifier (scikit-learn)
- **n_estimators:** {RF_PARAMS['n_estimators']}
- **class_weight:** balanced (guards against HIF minority class)
- **Evaluation:** {CV_FOLDS}-fold Stratified Cross-Validation (primary)
- **Holdout:** 80/20 stratified split (for visualisation only)

## Cross-Validation Results (Primary Performance Estimate)

| Metric             | Value          |
|--------------------|----------------|
| CV Accuracy        | {cv['cv_accuracy']:.4f} ± {cv['cv_accuracy_std']:.4f} |
| CV Precision (w)   | {cv['cv_precision_w']:.4f}         |
| CV Recall (w)      | {cv['cv_recall_w']:.4f}         |
| CV F1 (w)          | {cv['cv_f1_w']:.4f}         |

## HIF-Specific Results ← Safety-Critical Metric

| Metric         | Value   |
|----------------|---------|
| HIF Precision  | {cv['cv_hif_precision']:.4f}  |
| **HIF Recall** | **{cv['cv_hif_recall']:.4f}**  |
| HIF F1         | {cv['cv_hif_f1']:.4f}  |

> HIF Recall is the safety-critical metric: missing a real HIF is worse than
> a false alarm in a research/monitoring context.

## Top-5 Feature Importances

{top5_str}

## Limitations

1. **Simulation data only** — The dataset is from MATLAB/Simulink simulations of a microgrid, not field measurements from a real distribution network.
2. **Very small dataset** — ~120 samples is insufficient for robust generalisation; results should be interpreted cautiously.
3. **Possible data leakage** — Repeated feature vectors across folds cannot be excluded because no event identifier exists.
4. **Pre-extracted features** — DWT is performed by original dataset authors; GridSenti has not implemented its own raw-waveform DWT pipeline yet.
5. **Prototype thresholds** — Rule engine thresholds are not validated against utility/field data.
6. **Domain shift** — Performance on real 11 kV / 22 kV / 33 kV distribution feeder data may differ substantially.

## Scientific Honesty Statement

GridSenti does NOT claim to:
- Protect a real power grid at this stage.
- Guarantee HIF detection in the field.
- Interpret ML accuracy as real-world safety performance.

This is a **hackathon prototype** using simulated research data as a proof of concept.

## Next Steps

1. Obtain field measurement data from a real utility
2. Implement raw-waveform DWT in the ESP8266 / backend pipeline
3. Add fault localisation algorithms
4. Real-time inference via MQTT/FastAPI
5. Edge deployment on ESP8266 for telemetry pre-filtering
6. External validation on unseen distribution network data
"""

    EXPERIMENT_SUMMARY_PATH.write_text(summary, encoding="utf-8")
    print(f"[evaluate] Experiment summary -> {EXPERIMENT_SUMMARY_PATH}")


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    from ml.train import run_training
    from ml.preprocessing import inspect_dataset, load_dataset

    raw_df = load_dataset()
    dup_report = inspect_dataset(raw_df)

    results = run_training()
    results["duplicate_report"] = dup_report

    generate_all_reports(results)
    print("\n[OK] Evaluation complete.")
