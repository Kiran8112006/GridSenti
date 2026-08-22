# GridSenti — Dataset Documentation

## Primary Dataset Used

- **Dataset Name:** Fault data set
- **Author:** Arangarajan Vinayagam (2025)
- **Publisher:** Mendeley Data, V1
- **DOI:** [10.17632/rvypj5rs5b.1](https://doi.org/10.17632/rvypj5rs5b.1)
- **Location:** `backend/data/raw/Fault_dataset.csv`

---

## Dataset Overview & Structure

The dataset contains features extracted from simulated high-impedance faults (HIF) and other faults / switching transients in microgrid power networks modeled in MATLAB/Simulink.

### Columns
- `Class`: Event target category (text)
- `EA`: Energy feature for Phase A (Discrete Wavelet Transform energy)
- `EB`: Energy feature for Phase B
- `EC`: Energy feature for Phase C

---

## Classes Present

1. `Normal`: Normal operating condition (no fault)
2. `LG`: Line-to-ground fault
3. `LLG`: Line-to-line-to-ground fault
4. `LLLG`: Three-phase-to-ground fault
5. `LL`: Line-to-line fault
6. `HIF`: High-impedance fault (**Target Class for GridSenti**)
7. `CS`: Capacitor switching transient
8. `LS`: Load switching transient

---

## Critical Methodological Note

**Original Dataset Features vs. GridSenti Derived Features:**
- `EA`, `EB`, `EC` are pre-extracted Discrete Wavelet Transform (DWT) energy features provided by the original dataset authors.
- GridSenti does **NOT** perform raw-waveform DWT preprocessing on physical hardware in this phase.
- GridSenti computes derived features (`total_energy`, `mean_energy`, `max_energy`, `min_energy`, `energy_spread`, `energy_imbalance`, `log_EA`, `log_EB`, `log_EC`, `log_ratio_EA_EB`, `log_ratio_EA_EC`, `log_ratio_EB_EC`) safely using epsilon-guarded arithmetic for rule-based and ML classification.
