# GridSenti HIF Detection — Baseline Experiment Summary

**Generated:** 2026-08-22 00:32:18

---

## Dataset

- **Source:** Mendeley Data — "Fault data set" by Arangarajan Vinayagam
- **DOI:** 10.17632/rvypj5rs5b.1
- **Citation:** Vinayagam, A. (2025). Fault data set. Mendeley Data, V1. https://doi.org/10.17632/rvypj5rs5b.1
- **Total samples:** 120
- **HIF samples:** 15 (12.5%)
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

- Exact duplicate rows: **46**
- Feature-only duplicates: **46**
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

**Total features used:** 15

## Rule Engine

- Phase-agnostic prototype rule baseline
- Uses: energy_imbalance + relative energy_spread
- All thresholds are PROTOTYPE values requiring field/utility validation
- Output: NORMAL / SUSPICIOUS / POSSIBLE_HIF + score (0–100) + reasons

## ML Model

- **Algorithm:** RandomForestClassifier (scikit-learn)
- **n_estimators:** 200
- **class_weight:** balanced (guards against HIF minority class)
- **Evaluation:** 5-fold Stratified Cross-Validation (primary)
- **Holdout:** 80/20 stratified split (for visualisation only)

## Cross-Validation Results (Primary Performance Estimate)

| Metric             | Value          |
|--------------------|----------------|
| CV Accuracy        | 0.9917 ± 0.0167 |
| CV Precision (w)   | 0.9920         |
| CV Recall (w)      | 0.9917         |
| CV F1 (w)          | 0.9909         |

## HIF-Specific Results ← Safety-Critical Metric

| Metric         | Value   |
|----------------|---------|
| HIF Precision  | 1.0000  |
| **HIF Recall** | **0.9333**  |
| HIF F1         | 0.9600  |

> HIF Recall is the safety-critical metric: missing a real HIF is worse than
> a false alarm in a research/monitoring context.

## Top-5 Feature Importances

  1. log_ratio_EA_EC                0.1591
  2. EC                             0.1012
  3. log_EC                         0.0990
  4. mean_energy                    0.0944
  5. total_energy                   0.0803

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
