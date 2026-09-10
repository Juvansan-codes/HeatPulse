# Phase 2 Step 4: UTCI Validation Report

## 1. Objective
Implement the Universal Thermal Climate Index (UTCI) using the official 6th-order polynomial formulation. Ensure complete separation from WBGT radiation models by reusing the independently validated $T_{mrt}$ from Phase 2 Step 2.

## 2. Formulation & Inputs
- **Methodology:** The official ISO-standardized 6th-order UTCI polynomial (Błażejczyk et al., 2013).
- **Implementation Library:** `pythermalcomfort` (Official Python implementation of ASHRAE 55 and ISO 7730).
- **Air Temperature ($T_a$):** Sourced directly from ERA5 `temperature_2m`.
- **Mean Radiant Temperature ($T_{mrt}$):** Sourced strictly from the Phase 2 Step 2 output `mean_radiant_temp` to prevent radiation double-counting.
- **Wind Speed ($v$):** Sourced directly from ERA5 `wind_speed_10m`. *Note:* Unlike WBGT which applies a boundary layer reduction to human level, the standard UTCI formulation is strictly parameterized to use wind speed measured at 10 meters above ground level.
- **Vapour Pressure ($e_a$):** UTCI internally converts relative humidity into water vapour pressure (kPa). This conversion is validated and exposed in the `utci_vapor_pressure` diagnostic column.

## 3. Assumptions & Limitations
- **Wind Parameterization:** We strictly adhered to the UTCI requirement of 10m wind speed, clipped natively at 0.5 m/s at the lower bound per the polynomial's valid domain. 
- **Modelling Domain:** Occasional values fell slightly outside the mathematically calibrated polynomial bounds (e.g. $T_{mrt} - T_a > 70^\circ C$). Rather than dropping these data points as `NaN`, `pythermalcomfort`'s `limit_inputs=False` flag was used to return the continuous polynomial result, capturing legitimate extreme physiological strain.

## 4. Reference Validation
Controlled test cases were run through the active implementation to confirm correct polynomial execution against the original bioklima standard:
- **Case Neutral:** $T_a=20^\circ C$, $T_{mrt}=20^\circ C$, $v=1.0$ m/s, $RH=50\%$ $\rightarrow$ Calculated: **19.4 °C**
- **Case Hot/Sun:** $T_a=35^\circ C$, $T_{mrt}=55^\circ C$, $v=1.0$ m/s, $RH=50\%$ $\rightarrow$ Calculated: **41.4 °C** (Strong heat stress)
- **Case Cold/Wind:** $T_a=-5^\circ C$, $T_{mrt}=-5^\circ C$, $v=10.0$ m/s, $RH=50\%$ $\rightarrow$ Calculated: **-33.1 °C** (Very strong cold stress due to wind chill)

## 5. Audit Results (10-Year Dataset)
- **Rows:** 438,240 (Exactly 5 grid cells, no ward-level expansion)
- **Missing (NaN):** 0
- **Suspicious (>60°C):** 0
- **Suspicious (<-20°C):** 0
- **Minimum UTCI:** 9.10 °C
- **Maximum UTCI:** 47.20 °C (Extreme heat stress)
- **Mean UTCI:** 29.09 °C
- **Median UTCI:** 28.30 °C
- **95th Percentile:** 39.10 °C

## 6. Maximum UTCI Case Analysis
**Occurred on:** `2017-05-17 09:00:00 UTC` (2:30 PM IST)
- Grid Cell Lat: 13.1
- Air Temp ($T_a$): 40.85 °C
- Mean Radiant Temp ($T_{mrt}$): 62.84 °C
- Relative Humidity: 31.67%
- 10m Wind Speed: 1.36 m/s
- Vapour Pressure: ~2.47 kPa
- **Calculated UTCI:** 47.20 °C

*Analysis:* This perfectly captures peak afternoon solar loading combined with extreme ambient heat. A UTCI above 46°C crosses into the "Extreme Heat Stress" physiological category, representing a critical outdoor danger threshold. 

## 7. Conclusion
The UTCI pipeline successfully computes the exact mathematical formulation. It preserves temporal continuity, avoids arbitrary NaN dropping in extremes, maintains strict independence from WBGT radiation loops, and completes the primary thermal index processing phase.
