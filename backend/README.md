# GridSenti — Backend API & Machine Learning Engine

FastAPI backend service and HIF Machine Learning / Rule Engine for GridSenti.

---

## Directory Structure

```
backend/
├── app/
│   ├── main.py                     # FastAPI entry point
│   ├── api/routes.py               # API endpoints
│   ├── detection/
│   │   └── hif_detector.py         # Application layer wrapper -> ml/predict.py
│   └── ...
│
├── data/
│   ├── raw/
│   │   └── Fault_dataset.csv       # Real Mendeley HIF dataset (DOI: 10.17632/rvypj5rs5b.1)
│   ├── processed/
│   │   └── processed_dataset.csv   # Preprocessed & labelled dataset
│   └── README.md
│
├── ml/
│   ├── config.py                   # Paths, thresholds, hyperparams
│   ├── preprocessing.py            # Dataset loading, duplicate inspection, cleaning
│   ├── feature_extraction.py       # Safe feature derivation (ratios, imbalance)
│   ├── rule_engine.py              # Phase-agnostic prototype rule baseline
│   ├── train.py                    # Stratified 5-Fold CV & Random Forest training
│   ├── evaluate.py                 # Report generation (metrics, confusion matrix)
│   ├── predict.py                  # Single & batch inference API
│   └── model_utils.py              # Model persistence (joblib)
│
├── models/
│   ├── hif_random_forest.joblib    # Trained Random Forest classifier
│   └── feature_list.txt            # Order of input features for inference
│
├── reports/
│   ├── classification_report.txt   # Detailed metrics report
│   ├── confusion_matrix.png        # Visualization of holdout predictions
│   ├── feature_importance.png      # Feature ranking plot
│   ├── feature_importance.csv      # Feature Gini importance values
│   └── experiment_summary.md       # Complete methodology & results documentation
│
└── tests/
    └── test_ml_pipeline.py         # Pytest suite for ML engine & backend
```

---

## Execution Workflow Commands

### 1. Install Dependencies
```powershell
# Required for Python 3.14 (uses pre-built binary wheels)
pip install --prefer-binary -r requirements.txt
```

### 2. Preprocess & Inspect Dataset
```powershell
python -m ml.preprocessing
```

### 3. Train Random Forest Classifier
```powershell
python -m ml.train
```

### 4. Evaluate & Generate Reports
```powershell
python -m ml.evaluate
```

### 5. Run Prediction Test
```powershell
python -m ml.predict
```

### 6. Run Test Suite
```powershell
pytest tests/
```

### 7. Run FastAPI Server
```powershell
uvicorn app.main:app --reload --port 8000
```
