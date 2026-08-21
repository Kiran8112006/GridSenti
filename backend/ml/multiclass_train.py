"""
GridSenti — ml/multiclass_train.py
===================================
Train separate multi-class Random Forest classifier on public Mendeley dataset.

CLASSES (8 target classes in dataset):
--------------------------------------
Normal, LG, LLG, LLLG, LL, HIF, CS, LS

NOTE ON MODEL HONESTY:
----------------------
Downed Conductor is a target real-world event. The public dataset does NOT contain
a dedicated 'Downed Conductor' class label. The trained fault class in this dataset is 'HIF'.
This script documents dataset limitations (small sample size n=120, duplicate feature vectors).
Does NOT overwrite the existing binary HIF model (hif_random_forest.joblib).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import LabelEncoder

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.config import (
    MODELS_DIR,
    RAW_CSV_PATH,
    REPORTS_DIR,
    RF_PARAMS,
    EPSILON,
)
from ml.feature_extraction import extract_features
from ml.preprocessing import clean_dataset, load_dataset

# Separate Multi-class model paths
MULTICLASS_MODEL_PATH = MODELS_DIR / "multiclass_random_forest.joblib"
MULTICLASS_LABEL_ENCODER_PATH = MODELS_DIR / "multiclass_label_encoder.joblib"
MULTICLASS_REPORT_PATH = REPORTS_DIR / "multiclass_classification_report.txt"


def train_multiclass_model() -> Dict:
    """
    Train separate multi-class Random Forest model and evaluate via 5-Fold Stratified CV.
    """
    print("=" * 60)
    print("GRIDSENTI MULTI-CLASS MODEL TRAINING")
    print("=" * 60)

    # 1. Load & Clean Dataset
    df_raw = load_dataset(RAW_CSV_PATH)
    df_clean = clean_dataset(df_raw)

    # 2. Extract Features
    X = extract_features(df_clean[["EA", "EB", "EC"]])
    y_raw = df_clean["Class"].values

    # 3. Label Encoding
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    class_names = list(le.classes_)

    print(f"[+] Multi-class Targets: {class_names}")
    print(f"[+] Total Samples: {len(X)}")

    # 4. Stratified 5-Fold Cross Validation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    cv_accuracies = []
    y_true_all = []
    y_pred_all = []

    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y), 1):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        clf_fold = RandomForestClassifier(**RF_PARAMS)
        clf_fold.fit(X_train, y_train)
        y_pred = clf_fold.predict(X_val)

        acc = clf_fold.score(X_val, y_val)
        cv_accuracies.append(acc)
        y_true_all.extend(y_val)
        y_pred_all.extend(y_pred)

        print(f"    Fold {fold}/5 Accuracy: {acc * 100:.2f}%")

    mean_cv_acc = np.mean(cv_accuracies)
    std_cv_acc = np.std(cv_accuracies)
    print(f"[+] 5-Fold CV Mean Accuracy: {mean_cv_acc * 100:.2f}% (+/- {std_cv_acc * 100:.2f}%)")

    # 5. Fit Final Model on Complete Dataset
    final_model = RandomForestClassifier(**RF_PARAMS)
    final_model.fit(X, y)

    # 6. Save Model Artifacts
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(final_model, MULTICLASS_MODEL_PATH)
    joblib.dump(le, MULTICLASS_LABEL_ENCODER_PATH)
    print(f"[+] Saved multi-class model to: {MULTICLASS_MODEL_PATH}")

    # 7. Generate & Save Detailed Evaluation Report
    report_str = classification_report(
        y_true_all, y_pred_all, target_names=class_names, digits=4
    )
    cm = confusion_matrix(y_true_all, y_pred_all)

    report_text = f"""============================================================
GRIDSENTI MULTI-CLASS FAULT CLASSIFIER REPORT
============================================================
Dataset Citation: Mendeley Data V1 (DOI: 10.17632/rvypj5rs5b.1)
Classes Trained: {class_names}
Note: 'Downed Conductor' is a real-world target event, NOT a dataset class label.

5-Fold Stratified Cross-Validation Accuracy: {mean_cv_acc:.4f} +/- {std_cv_acc:.4f}

CLASSIFICATION REPORT:
{report_str}

CONFUSION MATRIX:
{cm}
"""

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(MULTICLASS_REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report_text)

    print(f"[+] Saved evaluation report to: {MULTICLASS_REPORT_PATH}")

    return {
        "mean_cv_accuracy": float(mean_cv_acc),
        "std_cv_accuracy": float(std_cv_acc),
        "classes": class_names,
        "classification_report": report_str,
    }


if __name__ == "__main__":
    train_multiclass_model()
