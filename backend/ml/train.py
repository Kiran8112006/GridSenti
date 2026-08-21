"""
GridSenti — ml/train.py
========================
Training pipeline for the HIF Random Forest classifier.

Workflow
--------
1. Load and preprocess the real Mendeley dataset.
2. Extract / derive features.
3. Duplicate inspection report (printed before any split).
4. Stratified 5-fold cross-validation → definitive performance estimate.
5. Optional 80/20 holdout split for confusion matrix visualisation only.
   The holdout accuracy is NOT presented as the definitive metric.
6. Retrain on all data and save the final model.

Why stratified CV?
   The dataset has only ~120 samples with possible repeated feature vectors.
   A single holdout split is unreliable at this scale.  CV over 5 folds gives
   a more robust performance estimate while keeping all data in use.

Leakage note
   No event/group identifier exists.  Stratification is by class label.
   Samples from the same simulated event MAY appear in both train and test
   folds.  This is documented and does NOT mean the accuracy reflects
   real-world generalisability.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import (
    StratifiedKFold,
    cross_validate,
    train_test_split,
)
from sklearn.preprocessing import LabelEncoder

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.config import (
    BINARY_TARGET_COLUMN,
    TARGET_COLUMN,
    ALL_FEATURES,
    CV_FOLDS,
    RANDOM_STATE,
    TEST_SIZE,
    RF_PARAMS,
    MODELS_DIR,
    HIF_CLASS_LABEL,
)
from ml.preprocessing import run_preprocessing_pipeline
from ml.feature_extraction import extract_features
from ml.model_utils import save_model


# ── Public API ────────────────────────────────────────────────────────────────

def run_training() -> dict:
    """
    Full training pipeline.  Returns a results dict with CV metrics and the
    trained model.
    """
    print("\n" + "=" * 60)
    print("GridSenti — HIF Detection Model Training")
    print("=" * 60)

    # ── Step 1: Load + preprocess ─────────────────────────────────────────────
    df = run_preprocessing_pipeline(save=True)
    print(f"\nProcessed dataset: {df.shape[0]} rows × {df.shape[1]} cols")

    # ── Step 2: Extract features ──────────────────────────────────────────────
    feature_df = extract_features(df)
    print(f"Feature matrix: {feature_df.shape}")

    X = feature_df[ALL_FEATURES].values
    y_multiclass = df[TARGET_COLUMN].values
    y_binary     = df[BINARY_TARGET_COLUMN].values   # 'HIF' | 'NON_HIF'

    # ── Step 3: Class distribution (before split) ─────────────────────────────
    print("\nClass distribution (binary):")
    for cls, cnt in sorted(zip(*np.unique(y_binary, return_counts=True)),
                           key=lambda x: x[0]):
        print(f"  {cls:10s}: {cnt}")

    n_hif = int((y_binary == HIF_CLASS_LABEL).sum())
    n_total = len(y_binary)
    print(f"\n  HIF samples : {n_hif}/{n_total} ({100*n_hif/n_total:.1f}%)")
    if n_hif < 10:
        print("  [!] Very few HIF samples - CV reliability is limited.")

    # ── Step 4: Stratified cross-validation (DEFINITIVE metric) ──────────────
    print(f"\n{'-'*60}")
    print(f"Stratified {CV_FOLDS}-Fold Cross-Validation (binary: HIF vs NON_HIF)")
    print(f"{'-'*60}")

    skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    clf_cv = RandomForestClassifier(**RF_PARAMS)

    # sklearn CV scorer for HIF class
    from sklearn.metrics import make_scorer, recall_score, precision_score, f1_score

    scoring_fitted = {
        "accuracy":      "accuracy",
        "precision_w":   "precision_weighted",
        "recall_w":      "recall_weighted",
        "f1_w":          "f1_weighted",
        "hif_recall":    make_scorer(recall_score,    labels=[HIF_CLASS_LABEL],
                                     average="macro", zero_division=0),
        "hif_precision": make_scorer(precision_score, labels=[HIF_CLASS_LABEL],
                                     average="macro", zero_division=0),
        "hif_f1":        make_scorer(f1_score,        labels=[HIF_CLASS_LABEL],
                                     average="macro", zero_division=0),
    }

    cv_results = cross_validate(
        clf_cv, X, y_binary,
        cv=skf,
        scoring=scoring_fitted,
        return_train_score=False,
        n_jobs=-1,
    )

    cv_metrics = {
        "cv_accuracy":       float(np.mean(cv_results["test_accuracy"])),
        "cv_accuracy_std":   float(np.std(cv_results["test_accuracy"])),
        "cv_precision_w":    float(np.mean(cv_results["test_precision_w"])),
        "cv_recall_w":       float(np.mean(cv_results["test_recall_w"])),
        "cv_f1_w":           float(np.mean(cv_results["test_f1_w"])),
        "cv_hif_recall":     float(np.mean(cv_results["test_hif_recall"])),
        "cv_hif_precision":  float(np.mean(cv_results["test_hif_precision"])),
        "cv_hif_f1":         float(np.mean(cv_results["test_hif_f1"])),
        "cv_fold_accuracies": cv_results["test_accuracy"].tolist(),
    }

    _print_cv_results(cv_metrics)

    # ── Step 5: Holdout split (VISUALISATION ONLY) ────────────────────────────
    print(f"\n{'-'*60}")
    print("Holdout Split (80/20 - for confusion matrix visualisation ONLY)")
    print("This is NOT the definitive performance estimate.")
    print(f"{'-'*60}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_binary,
        test_size=TEST_SIZE,
        stratify=y_binary,
        random_state=RANDOM_STATE,
    )
    clf_holdout = RandomForestClassifier(**RF_PARAMS)
    clf_holdout.fit(X_train, y_train)
    y_pred = clf_holdout.predict(X_test)

    from sklearn.metrics import classification_report, confusion_matrix
    print(f"\nHoldout test set: {len(y_test)} samples")
    print(classification_report(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred, labels=[HIF_CLASS_LABEL, "NON_HIF"])
    print(f"Confusion matrix [HIF, NON_HIF]:\n{cm}")

    holdout_metrics = {
        "holdout_y_test": y_test.tolist(),
        "holdout_y_pred": y_pred.tolist(),
        "holdout_cm": cm.tolist(),
        "holdout_labels": [HIF_CLASS_LABEL, "NON_HIF"],
    }

    # ── Step 6: Retrain on ALL data — final model ─────────────────────────────
    print(f"\n{'-'*60}")
    print("Training final model on ALL data (for deployment)")
    print(f"{'-'*60}")

    clf_final = RandomForestClassifier(**RF_PARAMS)
    clf_final.fit(X, y_binary)

    # Feature importances
    importances = pd.Series(clf_final.feature_importances_, index=ALL_FEATURES)
    importances = importances.sort_values(ascending=False)

    print(f"\nTop-10 feature importances (final model):")
    for feat, imp in importances.head(10).items():
        bar = "#" * int(imp * 50)
        print(f"  {feat:30s} {imp:.4f} {bar}")

    # ── Step 7: Save ─────────────────────────────────────────────────────────
    save_model(clf_final, list(ALL_FEATURES))
    print(f"\n[OK] Final model saved -> {MODELS_DIR}/hif_random_forest.joblib")

    return {
        "model": clf_final,
        "cv_metrics": cv_metrics,
        "holdout_metrics": holdout_metrics,
        "feature_importances": importances.to_dict(),
        "X": X,
        "y_binary": y_binary,
        "y_multiclass": y_multiclass,
        "feature_df": feature_df,
        "df": df,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _print_cv_results(m: dict) -> None:
    print(f"\n  CV Accuracy   : {m['cv_accuracy']:.4f} +/- {m['cv_accuracy_std']:.4f}")
    print(f"  CV Precision  : {m['cv_precision_w']:.4f}  (weighted)")
    print(f"  CV Recall     : {m['cv_recall_w']:.4f}  (weighted)")
    print(f"  CV F1         : {m['cv_f1_w']:.4f}  (weighted)")
    print(f"\n  -- HIF-specific --")
    print(f"  HIF Precision : {m['cv_hif_precision']:.4f}")
    print(f"  HIF Recall    : {m['cv_hif_recall']:.4f}  <- key safety metric")
    print(f"  HIF F1        : {m['cv_hif_f1']:.4f}")
    print(f"\n  Per-fold accuracies:")
    for i, acc in enumerate(m["cv_fold_accuracies"], 1):
        print(f"    Fold {i}: {acc:.4f}")


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    results = run_training()
    print("\nTraining complete.")
