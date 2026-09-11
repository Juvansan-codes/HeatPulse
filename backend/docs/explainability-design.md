# Phase 5-B: HeatPulse Ward Explainability Design Report

## 1. Existing Fields Available for Explanation
Based on a review of the production serving schema (`002_production_serving.sql`) and API contract, the following fields are natively available:
- **Exposure**: `population`, `population_density`
- **Vulnerability**: `vulnerability`, `healthcare_facility_count`, `healthcare_facilities_per_10000_derived_population`, `healthcare_access_capacity`
- **Heat Hazard (Grid-level)**: `htsi`, `htsi_level`, `htsi_label`, `utci`, `wbgt_outdoor`, `heat_index`, `mean_radiant_temp`, `burden_24h`, `burden_72h`, `thermal_hazard_score`
- **Risk (Ward-level)**: `human_heat_risk`, `heat_hazard`, `extreme_utci_flag`

## 2. Fields Missing But Potentially Useful
The frozen HTSI composition includes:
- `UTCI stress score` (U)
- `WBGT percentile anomaly` (W)
- `Nighttime anomaly` (N)
- `Persistence component` (P)

**Limitation**: These intermediate component scores and the nighttime anomaly are **NOT** stored in the `forecast_grids` or `ward_forecast_risk` tables. We only have the raw indicators (`utci`, `wbgt_outdoor`) and the final `htsi` and `thermal_hazard_score`. Therefore, the explanation cannot fully decompose the HTSI score, but it can highlight the raw indicators.

## 3. Recommended Endpoint Design
**Option B: Add a dedicated endpoint `GET /api/v1/wards/{ward_id}/explanation`**

**Why?**
A dedicated endpoint isolates the analytical logic (percentile ranking, string generation) from the core data pipelines. Extending the existing `/forecast` endpoint would significantly bloat the JSON payload for all 5 horizons across all wards, even when the user isn't requesting an explanation. Explainability is an on-demand interaction ("Why this ward?"), making a dedicated route the most performant and semantically appropriate choice.

*(Note: The endpoint would accept `valid_time` or `lead_day` as a query parameter to fetch the required forecast horizon for the explanation. This ensures efficient performance by fetching only one valid_time/lead_day record rather than all five horizons).*

## 4. Proposed JSON Response Structure
```json
{
  "ward_id": 1,
  "initialization_time": "2025-12-26T23:00:00Z",
  "valid_time": "2025-12-27T23:00:00Z",
  "lead_hours": 24,
  "risk": {
      "human_heat_risk": 0.42,
      "heat_hazard": 0.68
  },
  "heat_hazard": {
      "htsi": 68.5,
      "htsi_level": 3,
      "htsi_label": "High",
      "utci": 34.2,
      "wbgt": 31.0,
      "heat_index": 38.5,
      "tmrt": 40.1,
      "burden_24h": 5.2,
      "burden_72h": 12.4,
      "extreme_utci_flag": false
  },
  "exposure": {
      "population": 15400,
      "population_density": 4529.4,
      "population_density_city_percentile": 87.4
  },
  "vulnerability": {
      "vulnerability": 0.35,
      "vulnerability_city_percentile": 65.2,
      "healthcare_facility_count": 3,
      "healthcare_facilities_per_10000": 1.9,
      "healthcare_availability_city_percentile": 20.1
  },
  "drivers": [
      {
          "category": "heat_hazard",
          "label": "High HTSI level",
          "value": 68.5,
          "unit": "score",
          "description": "The ward has a project-specific operational HTSI level of High."
      },
      {
          "category": "exposure",
          "label": "High relative population density",
          "value": 87.4,
          "unit": "percentile",
          "description": "Population density is in the 87th percentile among current GCC wards."
      }
  ],
  "summary": "This ward's operational heat-impact risk reflects the combination of thermal hazard, population exposure, and vulnerability."
}
```

## 5. Deterministic Driver-Identification Logic
- **Heat Hazard Drivers**:
  - `htsi_level >= 3`: Triggers "High HTSI level".
  - `extreme_utci_flag == true`: Triggers "Extreme UTCI".
  - *(Note: Raw indicators like UTCI, WBGT, and burden metrics are displayed but will not independently trigger narrative drivers without a frozen categorical boundary, preserving scientific integrity).*
- **Exposure Drivers**:
  - `population_density_city_percentile >= 80`: Triggers "High relative population density".
- **Vulnerability Drivers**:
  - `vulnerability_city_percentile >= 80`: Triggers "High relative vulnerability".
  - `healthcare_availability_city_percentile <= 20`: Triggers "Limited healthcare availability".

## 6. Exact Language for Explanations
- "The ward has a project-specific operational HTSI level of [Normal/Moderate/High/Very High/Extreme]."
- "[UTCI/WBGT] forms part of the operational risk calculation."
- "Population density is in the [X]th percentile among current GCC wards."
- "Vulnerability is in the [X]th percentile among current GCC wards."
- "Healthcare availability is in the [X]th percentile among current GCC wards."
- **Summary string**: "This ward's operational heat-impact risk reflects the combination of thermal hazard, population exposure, and vulnerability."

## 7. Which Values are Direct DB Values?
- All numerical values within the `risk`, `heat_hazard`, `exposure`, and `vulnerability` JSON objects (except the percentile computations).

## 8. Which Values are Derived Purely for Presentation?
- The `drivers` array and its contents (`label`, `description`).
- The `summary` string.
- The percentile rank calculations (`_city_percentile` fields) relative to the 200 current GCC wards.

## 9. Proposed Percentile/Ranking Logic
The API calculates the relative rank of the ward against the city-wide distribution dynamically.
- **Reference Population**: The percentile computes the rank out of **all 200 current GCC wards**. Wards with null values for a metric are placed at the bottom of the rank order but are explicitly excluded from percentile scoring to prevent skew, though the divisor remains the total non-null valid ward count.
- **Labeling**: These are strictly labeled as "relative city percentile" or "explanatory ranking" to distinguish them from scientific warning thresholds.

## 10. Scientific Limitations & Safety
- **No HTSI Decomposition**: The explanation does not attempt to reverse-engineer or reconstruct the mathematical HTSI decomposition (U, W, N, P) because the raw sub-components are not persisted in the database.
- **Non-Causal Language**: All driver descriptions are correlative and factual ("forms part of the operational risk calculation", "is associated with"). Causal language ("causes", "makes residents unsafe") is explicitly forbidden.
- **No New Scientific Models**: The API is purely a presentation layer. It does not introduce new weightings, train ML models, compute SHAP values, or alter alert thresholds. The `human_heat_risk` remains a continuous score.

## 11. Client Compatibility (Next.js & Flutter)
**Yes.** The JSON response cleanly abstracts presentation strings from raw data. By providing pre-assembled strings (`description`, `summary`) and categorization (`category`, `label`), both Next.js and Flutter can render the explainability UI directly without complex UI-side thresholds.

## 12. Database / Schema Changes Required
**None.** The API will calculate percentile rankings on-the-fly in memory (e.g., using `scipy.stats.percentileofscore` or database rank functions) using the existing read-only tables.
