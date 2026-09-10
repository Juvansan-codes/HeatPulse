# Phase 4 Step 3: Final Scientific Audit

## TABLE A: Weather Baseline Metrics (Test Set 2025)

| Weather variable | Raw MAE | Mean Bias MAE | XGBoost MAE | Best | Imprv % |
|------------------|---------|---------------|-------------|------|---------|
| Temperature | 1.03 | 1.18 | 0.91 | **XGBoost** | 11.8% |
| RH | 5.93 | 7.09 | 5.89 | **XGBoost** | 0.6% |
| Wind | 1.23 | 0.84 | 0.81 | **XGBoost** | 34.2% |
| Radiation | 36.48 | 36.32 | 36.78 | **Mean Bias** | -0.8% |

## TABLE B: Thermal Metric Validation (Test Set 2025)

| Thermal metric | Raw MAE | Mean Bias MAE | XGBoost MAE | Best | Imprv % |
|----------------|---------|---------------|-------------|------|---------|
| Tmrt | 2.45 | 2.46 | 2.11 | **XGBoost** | 14.0% |
| WBGT | 0.88 | 0.79 | 0.78 | **XGBoost** | 11.3% |
| UTCI | 1.97 | 1.63 | 1.48 | **XGBoost** | 24.8% |
| Heat Index | 1.49 | 1.65 | 1.28 | **XGBoost** | 13.9% |
| HTSI | 4.19 | 3.12 | 3.28 | **Mean Bias** | 21.8% |

## TABLE C: HTSI Components MAE

| Component | Raw | Mean Bias | XGBoost | Best |
|-----------|-----|-----------|---------|------|
| UTCI | 1.97 | 1.63 | 1.48 | **XGBoost** |
| WBGT | 0.88 | 0.79 | 0.78 | **XGBoost** |
| B24 | 5.34 | 2.64 | 2.94 | **Mean Bias** |
| B72 | 5.17 | 2.19 | 2.53 | **Mean Bias** |
| N | 2.87 | 2.87 | 3.12 | **Raw** |
| THS | 4.43 | 3.51 | 3.64 | **Mean Bias** |
| HTSI | 4.19 | 3.12 | 3.28 | **Mean Bias** |

## TABLE D: Extreme Event Counts (UTCI >= 46°C)

- **actual_truth_extreme_events**: 0
- **raw_predicted_extreme_events**: 16
- **xgb_predicted_extreme_events**: 0

*No positive extreme-event cases occurred in the 2025 test set; precision/recall/F1 are not applicable.*

## TABLE E: HTSI Alert Component

**Overall Accuracy** - Raw: 0.773 | Mean Bias: 0.776 | XGBoost: 0.760

## Distribution Checks (Over-correction)

| Variable | Dist | Truth | Raw | XGBoost |
|----------|------|-------|-----|---------|
| Temperature | Mean | 27.97 | 28.12 | 27.75 |
| Temperature | Min | 17.68 | 16.95 | 17.16 |
| Temperature | Max | 37.87 | 40.46 | 37.74 |
| Temperature | P95 | 33.90 | 35.29 | 32.90 |
| RH | Mean | 73.60 | 74.47 | 76.83 |
| RH | Min | 28.69 | 24.00 | 32.68 |
| RH | Max | 99.82 | 100.00 | 99.65 |
| RH | P95 | 93.90 | 95.31 | 93.36 |
| Wind | Mean | 3.15 | 2.12 | 3.35 |
| Wind | Min | 0.04 | 0.00 | 1.17 |
| Wind | Max | 9.19 | 15.00 | 16.10 |
| Wind | P95 | 5.25 | 4.25 | 5.36 |
| Radiation | Mean | 212.97 | 218.90 | 211.05 |
| Radiation | Min | -0.00 | -1.00 | 0.00 |
| Radiation | Max | 1027.34 | 1034.00 | 1032.38 |
| Radiation | P95 | 823.22 | 803.00 | 777.32 |

## Lead-Time Performance (MAE)

| Metric | Day | Raw | Mean Bias | XGBoost |
|--------|-----|-----|-----------|---------|
| Temperature | 1 | 0.93 | 1.13 | 0.85 |
| HTSI | 1 | 3.63 | 2.93 | 3.02 |
| Temperature | 2 | 0.97 | 1.17 | 0.88 |
| HTSI | 2 | 3.75 | 3.00 | 3.18 |
| Temperature | 3 | 1.03 | 1.20 | 0.92 |
| HTSI | 3 | 4.05 | 3.14 | 3.36 |
| Temperature | 4 | 1.06 | 1.18 | 0.93 |
| HTSI | 4 | 4.64 | 3.22 | 3.39 |
| Temperature | 5 | 1.13 | 1.24 | 0.95 |
| HTSI | 5 | 4.89 | 3.32 | 3.45 |

## Final Verdict
- **PHASE 4 STEP 3**: PASS WITH LIMITATIONS
  - *Operational Recommendation*: XGBoost explicitly improves fundamental weather variables (Temperature, RH, Wind) and pointwise thermal states (UTCI, WBGT). However, due to temporal smoothing conflicts in cumulative HTSI derivations (B24, B72, Nighttime stress), simple Mean Bias correction preserves the chronological persistence behavior better. Retain XGBoost for pointwise endpoints; use Mean Bias strictly for cumulative HTSI integration.