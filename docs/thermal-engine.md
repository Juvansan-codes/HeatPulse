# Thermal Engine Documentation

## Core Metrics

### 1. Heat Index
- **Formulation:** NOAA NWS Rothfusz Regression & Steadman Apparent Temperature.
- **Reference:** Rothfusz, L. P. (1990). "The heat index 'equation' (or, more than you ever wanted to know about heat index)". NWS Southern Region Technical Attachment, SR/SSD 90-23, Fort Worth, Texas.
- **Assumptions:** 
  - Valid only for Temperatures >= 26.7°C (80°F).
  - Below 80°F, falls back to the simple Steadman apparent temperature.
  - Does not account for direct solar radiation load.

### 2. Wet Bulb Globe Temperature (WBGT)
- **Formulation:** Liljegren et al. (2008) Outdoor WBGT Model.
- **Reference:** Liljegren, J. C. et al. (2008). Modeling the Wet Bulb Globe Temperature Using Standard Meteorological Measurements.
- **Methodology & Assumptions:**
  - Uses the `pywbgt` implementation (Cython-compiled C code from Liljegren).
  - Actively calculates Natural Wet Bulb ($T_{nwb}$) and Globe Temperature ($T_g$) using non-linear heat/mass transfer balances.
  - Wind speed is taken at 10m from ERA5, and downscaled to 2m using the `urban=True` and `zspeed=10m` flags to apply an urban boundary layer profile.
  - Solar load is derived natively from GHI and solar angles.
  - **Separation of Indices:** WBGT computes its own radiation load; the $T_{mrt}$ derived in Step 2 is intentionally NOT fed into WBGT to prevent cross-contamination of independent indices.
- **Status:** Fully implemented and validated across 2014-2023 grid-level processing.

### 3. Universal Thermal Climate Index (UTCI)
- **Formulation:** Official 6th-order operational polynomial approximation.
- **Implementation:** `pythermalcomfort` (Official Python implementation of ASHRAE 55 and ISO 7730).
- **Reference:** Błażejczyk, K. et al. (2013). An introduction to the Universal Thermal Climate Index (UTCI). Geographia Polonica, 86(1), 5-10.
- **Inputs & Conventions:**
  - **Wind Speed:** Strictly uses 10m wind speed ($v_{10}$) natively from ERA5. UTCI is deliberately parameterized for $v_{10}$, unlike WBGT which expects boundary layer scaling to 2m. Clipped implicitly at the 0.5 m/s valid polynomial boundary.
  - **Vapour Pressure ($e_a$):** Calculated internally from Relative Humidity and Air Temperature, expressed in kPa as required by the formulation.
  - **Radiation ($T_{mrt}$):** Reuses the independently validated $T_{mrt}$ calculated in Step 2.
- **Assumptions:** Evaluated using `limit_inputs=False` to safely capture extreme thermal strain (e.g. $T_{mrt} - T_a > 70^\circ C$) occurring natively in extreme summer conditions without arbitrarily dropping them to NaN.
- **Status:** Fully implemented and validated across 2014-2023 grid-level processing.

### 4. Phase 2 Step 5 Cross-Validation
- **Scope:** Read-only validation and characterization of Heat Index, independent Liljegren WBGT, and UTCI using the Step 4 parquet as the source of truth.
- **Checks:** Dataset integrity, representative conditions, controlled one-variable physics tests, top-20 UTCI events, Pearson/Spearman correlations, published classification references, hourly/monthly summaries, and five-grid spatial summaries.
- **Status:** **PASS WITH LIMITATIONS**. See [the Step 5 audit report](phase2_step5_thermal_validation.md).
- **Scientific boundary:** The three indices have different formulations and must not be forced to agree, merged into one scale, or treated as medical or mortality predictions. ERA5-Land results remain grid-level; Tmrt remains modeled rather than directly observed.

### 5. Mean Radiant Temperature ($T_{mrt}$)
- **Formulation:** ISO 7726 / VDI 3787 Part 2 two-hemisphere radiation balance (RayMan analytical foundation).
- **Inputs:** Air temperature, dew point temperature, solar radiation (GHI), UTC timestamp, latitude, longitude.
- **Methodology & Assumptions:**
  - **Solar Geometry:** Spencer (1971) algorithm. Computed at the *midpoint* (T - 30 mins) of the ERA5-Land hourly accumulation period to prevent unphysical twilight direct-beam spikes.
  - **Direct/Diffuse Split:** Erbs et al. (1982) clearness index model. Direct Normal Irradiance ($K_{dir}$) is strictly capped at $0.9 \times I_0$ with excess energy re-allocated to diffuse ($K_{diff}$) to maintain perfect GHI energy balance.
  - **Human Geometry:** Standing person with projected area factor $f_p = 0.308 \sin(\theta_z) + 0.043 \cos(\theta_z)$. Shortwave absorption $\alpha_k = 0.7$, longwave emissivity $\epsilon_p = 0.97$.
  - **Reflected Shortwave:** Assumes constant urban albedo $\alpha_s = 0.20$.
  - **Downward Longwave:** Brutsaert (1975) clear-sky emissivity formula ($L_{\downarrow} = \epsilon_{sky} \sigma T_a^4$).
  - **Upward Longwave:** Stefan-Boltzmann law assuming $T_s \approx T_a$ (model limitation: likely underestimates afternoon asphalt radiation).
- **Status:** Implemented and validated for 2014-2023 grid-level processing.

## Radiation & Energy (SSRD)
- **Variable:** Surface Solar Radiation Downwards (`ssrd`)
- **ERA5-Land Native Representation:** Accumulated Joules per square meter ($J/m^2$). (`GRIB_stepType: accum`)
- **Conversion to Instantaneous Flux:** To convert the hourly ERA5-Land `ssrd` accumulation into average Instantaneous Solar Radiation Flux ($W/m^2$) for thermal equations (like outdoor WBGT/UTCI), we must divide the accumulated $J/m^2$ by the accumulation period (3600 seconds for hourly steps).
- **Rule:** Do NOT blindly use raw `ssrd` directly in equations requiring $W/m^2$.
- **Negative-value handling:** Raw ERA5 SSRD-derived GHI contains 3,940 negative values in the Step 4 source. These are treated as nonphysical numerical/reanalysis artifacts and clipped to zero before radiation-dependent calculations. No negative GHI is used by the thermal calculations; the historical source outputs remain unchanged.

## Spatial Aggregation
- **Method:** Nearest-grid assignment from each GCC ward centroid to the closest valid ERA5-Land grid cell using Haversine distance.
- **Process:** Each of the 200 GCC wards is mapped to its nearest ERA5-Land grid cell, creating a relational lookup (`data/processed/gis/spatial_ward_mapping.csv`).
- **Limitation:** The Chennai pilot analysis uses five valid ERA5-Land grid cells. Ward-level risk is derived relationally from the nearest assigned grid cell; the underlying meteorology remains grid-level.
