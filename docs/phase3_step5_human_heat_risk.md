# Phase 3 Step 5: Ward-Level Human Heat Risk

## Output

`data/processed/risk/ward_heat_risk_latest_snapshot.csv` contains one record for each of the 200 current GCC wards at the latest available HTSI timestamp, joined relationally through the existing nearest ERA5-Land grid mapping. The decade-long HTSI fact table is not duplicated to ward-hour records.

## Formula selection

The tested alternatives were:

- A: `Risk = H x E x V`
- B: `Risk = H x E x (0.5 + 0.5V)`

The implementation selects **B**, where `H = HTSI/100`, `E` is normalized population-density exposure, and `V` is the reduced vulnerability score. Formula B retains hazard and exposure prioritization even when incomplete vulnerability evidence produces a low vulnerability value; it avoids zeroing operational prioritization.

`human_heat_risk` is an operational **Ward-level Heat Impact Risk** prioritization score. It is not mortality probability, death prediction, medical risk, or a clinically validated health score.

The integrated `data_quality_confidence` is `LOW_TO_MEDIUM`: the ward/grid join and HTSI source are strong, while WorldPop is modeled and healthcare is an availability proxy with unstated source vintage.

## Inputs and provenance

- HTSI: existing `data/processed/weather/htsi_2014_2023.parquet`, unchanged.
- Exposure: derived WorldPop R2025A 2020, 100 m population aggregated to current GCC 2025 wards.
- Healthcare: HWC/UPHC availability proxy from the local GCC PDF and exact current Zone/Division identifier match.
- Green/cooling: omitted because no current ward-compatible spatial source was available.
- Slum/informal settlement: omitted because current authoritative ward-compatible spatial data were not available for this implementation.
- Demographic and observed health outcomes: omitted; no compatible authoritative current-200-ward data were established.

Machine-readable report: `data/validation/risk/phase3_step5_human_heat_risk_report.json`.
