# Phase 4 Step 4: Operational Forecast Validation Report

## 1. End-to-End HTSI Baseline Comparison (Test Set 2025)

To objectively evaluate the selected operational variable configuration, HTSI performance was evaluated end-to-end against Raw NWP and Mean Bias pipelines.

| Model | Day | MAE | RMSE | Bias | Correlation |
|---|---|---|---|---|---|
| **Raw NWP** | 1-5 | 5.97 | 8.50 | 4.22 | 0.914 |
| **Mean Bias** | 1-5 | 4.72 | 6.40 | -0.68 | 0.917 |
| **Operational** | 1 | 4.19 | 5.71 | -0.85 | 0.921 |
| **Operational** | 2 | 4.24 | 5.77 | -0.76 | 0.919 |
| **Operational** | 3 | 4.35 | 6.00 | -0.63 | 0.912 |
| **Operational** | 4 | 4.35 | 6.04 | -0.10 | 0.911 |
| **Operational** | 5 | 4.47 | 6.21 | 0.25 | 0.909 |

**Conclusion**: The Operational configuration outperformed both the Raw NWP and Mean Bias baselines on the evaluated 2025 test set. HTSI RMSE remained relatively stable across the Day 1–5 forecast horizon, ranging from 5.71 to 6.21 points in the evaluated 2025 hindcast. This indicates limited degradation across the tested lead times, although RMSE does not constitute an error bound or guarantee forecast accuracy.

## 2. Initialization and Row Uniqueness Audit

- **Forecast Calibrated Rows**: 426,300
- **Ward Risk Rows**: 17,052,000
- **Unique initialization times**: 17,100
- **Unique valid times**: 17,100
- **Unique wards**: 200
- **Unique grids**: 4 (Note: The established 5-grid domain contains `12.8,80.2`, but it is absent from the Ward Risk product because it has zero current GCC ward assignments. It remains fully present in the underlying meteorological forecast dataset and is excluded ONLY from the ward-level mapped risk product).
- **Duplicate count on [initialization_time, timestamp, ward_id]**: 0

## 3. Persistence Leakage Test

- **HTSI_original == HTSI_without_future_truth**: True
- **max_abs_HTSI_difference**: 0.0
- **max_abs_B24_difference**: 0.0
- **max_abs_B72_difference**: 0.0
- **max(observed_truth) < Initialization Time T**: True
- **min(forecast) >= Initialization Time T**: True

## 4. Alert Grouping Audit

The initial script grouped events sequentially across initialization boundaries, creating falsely disconnected records due to the 24-hour nature of the initialization snapshots. Event deduplication was modified to operate across the continuous `lead_day` hourly valid times to simulate a realistic operational issuance.
- **Raw alert rows (HTSI Level >= 3 or UTCI >= 46)**: 4,149,196
- **Total deduplicated events (fixed grouping)**: 662,513
- **Sample Long Event Severity**: [3, 3, 3, 3] (Continuous 4-hour High severity treated as ONE single event)

## 5. Spatial Uniqueness

- **Unique HTSI values**: 164,832 (Driven by 4 valid meteorological grids)
- **Unique Human Heat Risk values**: 10,260,509
- **Duplicate Risk-value Count**: 6,791,491
- **Conclusion**: Human Heat Risk is independently calculated per ward using ward-specific exposure and vulnerability inputs while meteorological hazard is inherited from the assigned grid. Duplicate numerical risk values are kept separate from duplicate record keys.