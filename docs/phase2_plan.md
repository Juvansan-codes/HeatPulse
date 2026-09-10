# Phase 2 Implementation Plan: Thermal Engine & Spatial Processing

This plan defines the architecture, mathematical formulations, and spatial logic for transforming the canonical Phase 1D ERA5-Land dataset into a robust, radiation-aware thermal stress engine.

## 1. Spatial Mapping Methodology
**Challenge:** We have 5 valid ERA5-Land cells (land-only) representing Chennai. The official Chennai boundary includes 200 wards. Coastal/edge wards fall geometrically into oceanic ERA5 grid cells (which are NaN and were discarded).
**Methodology:** We will use **Nearest-Neighbor Centroid Assignment (Haversine Distance)**. 
- Calculate the geographic centroid for all 200 GCC wards.
- For each ward, compute the Haversine distance to the 5 valid ERA5-Land cell centers.
- Assign the ward to the single closest valid land cell.
- **Output Definition:** Outputs will be explicitly named **"ward-level risk derived from nearest ERA5-Land grid-cell meteorology"** to clarify that these are not independent true ward-scale observations.
- **Assignment Confidence:** For each ward, the output schema will retain `assigned_grid_id`, `distance_km`, and `centroid_coordinates`. Wards with a distance > 10km will be explicitly flagged as "lower-confidence spatial assignments" (note that 10 km is a project-defined quality-control threshold, not a scientifically established accuracy boundary).
- **Storage Strategy:** To prevent duplicating 87,648 rows $\times$ 200 wards, the output schema will remain relational: `dim_grid` (5 cells), `dim_ward` (200 wards mapped to a grid_id), and `fact_weather` (attached to grid_id).

## 2. Scientific formulation decision: Radiation & Tmrt Methodology

To calculate the Universal Thermal Climate Index (UTCI), we require the Mean Radiant Temperature ($T_{mrt}$). $T_{mrt}$ is defined as the uniform temperature of an imaginary enclosure in which the radiant heat transfer from the human body is equal to the radiant heat transfer in the actual non-uniform enclosure.

### Selected Formulation
We have selected the **ISO 7726** standard human radiation balance, specifically implemented using the **VDI 3787, Part 2 (2008)** two-hemisphere model for a standing person (commonly known as the RayMan analytical model foundation).

### Equations & Physical Derivation
The mean radiant flux density ($S_{str}$, in $W/m^2$) absorbed by the human body is the sum of absorbed shortwave and longwave radiation:
$S_{str} = \alpha_k \left( f_p \cdot K_{dir} + 0.5 \cdot K_{diff} + 0.5 \cdot K_{ref} \right) + \epsilon_p \left( 0.5 \cdot L_{\downarrow} + 0.5 \cdot L_{\uparrow} \right)$

To find $T_{mrt}$, we equate $S_{str}$ to the radiation that would be absorbed from the imaginary enclosure emitting as a blackbody ($\sigma (T_{mrt}+273.15)^4$). The human body absorbs this enclosure radiation multiplied by its own emissivity ($\epsilon_p$):
$\epsilon_p \sigma (T_{mrt} + 273.15)^4 = S_{str}$

Rearranging for $T_{mrt}$ (in °C):
$T_{mrt} = \left( \frac{S_{str}}{\epsilon_p \sigma} \right)^{0.25} - 273.15$

*Dimensional Check:* $S_{str}$ is in $W/m^2$. $\epsilon_p$ is dimensionless. $\sigma$ is $W/(m^2 K^4)$. The quotient is $K^4$, and the 4th root is Kelvin. Subtracting 273.15 yields °C. The derivation is physically and dimensionally sound. Emissivity is correctly applied and not double-counted because it defines the absorptivity of the human subject in the enclosure.

### Variables & Constants
- $\sigma = 5.67 \times 10^{-8} \, W/(m^2 K^4)$ (Stefan-Boltzmann constant).
- $\alpha_k = 0.70$ (Shortwave absorption coefficient of clothed human).
- $\epsilon_p = 0.97$ (Longwave emissivity of clothed human).
- $f_p$: Projected area factor, dependent on solar zenith angle.
- $K_{dir}, K_{diff}, K_{ref}$: Direct, diffuse, and reflected shortwave radiation ($W/m^2$).
- $L_{\downarrow}, L_{\uparrow}$: Downward atmospheric and upward surface longwave radiation ($W/m^2$).

### Assumptions & Approximations
Because native direct/diffuse shortwave and thermal longwave (STRD) fluxes are missing from our ERA5-Land extraction, the following approximations are strictly applied:
1. **Shortwave Split:** Global Horizontal Irradiance ($GHI$) from ERA5 SSRD is split into $K_{dir}$ and $K_{diff}$ using the empirical **Erbs et al. (1982)** clearness index model.
2. **Reflected Shortwave:** $K_{ref} = GHI \times \alpha_s$, assuming a constant urban surface albedo of $\alpha_s = 0.20$.
3. **Longwave Downward:** $L_{\downarrow}$ is estimated using the **Brutsaert (1975)** formula ($L_{\downarrow} = \epsilon_{sky} \sigma T_a^4$), relying on air temperature and vapor pressure.
4. **Longwave Upward:** $L_{\uparrow}$ is estimated using the Stefan-Boltzmann law. Due to missing surface skin temperature data, we assume surface temperature equals air temperature ($T_s \approx T_a$).

### Limitations
This formulation is explicitly labeled as a **model-based approximation**. The assumption $T_s \approx T_a$ will likely underestimate upward longwave radiation over hot urban asphalt during peak afternoon hours.

### References
- ISO 7726 (1998): Ergonomics of the thermal environment.
- VDI 3787 Part 2 (2008): Environmental meteorology – Methods for the human biometeorological evaluation of climate and air quality for urban and regional planning.

## 3. Thermal Indices Review & Upgrades

### A. Shade Heat Index
- **Formulation:** NOAA NWS Rothfusz Regression.
- **Status:** Valid only for baseline shade conditions $\ge$ 26.7°C. Does not ingest solar radiation. Will be clearly labeled "Shade Heat Index" in all outputs.

### B. Wet Bulb Globe Temperature (WBGT)
- **Formulation:** Liljegren et al. (2008) Outdoor WBGT model.
- **Required Inputs:** Air Temperature ($T_a$), Vapor Pressure/RH, Wind Speed, Global Solar Radiation ($W/m^2$), Solar Zenith Angle.
- **Available Inputs:** $T_a$, RH, Wind Speed (at 10m), SSRD.
- **Estimated Inputs:** Solar Zenith Angle (from time/coords), Wind Speed at 2m (scaled from 10m using a logarithmic profile assumption), Barometric Pressure (from ERA5 `sp`).
- **Assumptions:** Standard barometric pressure and default urban wind shear profile.
- **Expected accuracy:** Appropriate as a model-based outdoor WBGT approximation. Accuracy is limited by ERA5-Land spatial resolution, meteorological input uncertainty, and assumptions used to estimate missing radiative or near-surface quantities.

### C. Universal Thermal Climate Index (UTCI)
- **Formulation:** Standard UTCI polynomial utilizing the newly derived $T_{mrt}$.
- **Integration:** The derived $T_{mrt}$ will replace the baseline assumption of $T_{mrt} = T_a$, allowing daytime UTCI to correctly reflect the extreme thermal load of direct Chennai sunlight.

## 4. Human Thermal Stress Index (HTSI) Design
**Concept:** A transparent, prototype composite metric tailored for the SIH26083 hackathon goals. 
**Disclaimer:** This is a provisional project design choice and NOT an epidemiologically validated medical standard.

**Provisional Configuration:**
`HTSI = (0.50 * UTCI_norm) + (0.30 * WBGT_norm) + (0.20 * Duration_Penalty)`
- **Normalization Ranges:** Min-Max scaling using the historical 10-year 1st and 99th percentiles for UTCI and WBGT.
- **Clipping Behavior:** Values falling outside the 1st/99th percentile historical bounds are strictly clamped to [0.0, 1.0].
- **Duration Penalty Formula:** `min(1.0, consecutive_hot_hours / 72.0)`
  - *Note:* 72 hours is a project-defined operational scaling parameter, and UTCI > 32°C is a project-defined operational stress threshold. Neither should be presented as a universal medical or epidemiological threshold.
- **Score Derivation:** The final continuous score [0, 1] is mapped to a discrete 1–5 risk scale via equal-width binning (e.g., 0.0-0.2 = 1, 0.8-1.0 = 5).
- **Sensitivity Testing:** We will test varying weight distributions (e.g., 70/10/20) against known historical Chennai heatwaves to observe metric stability.

## 5. Temporal Features Extraction
We will derive a daily aggregation table (`fact_daily_stress`):
- **Timezone Handling:** All raw ERA5 timestamps are UTC. Daily grouping and nighttime definitions will be evaluated explicitly in **IST (UTC+05:30)**.
- **Nighttime Heat ($T_{min}$):** Minimum temperature between 22:00 and 06:00 IST. The overnight window crossing midnight (e.g., 22:00 Day N to 06:00 Day N+1) will be assigned to the calendar day of the morning (Day N+1).
- **Consecutive Stress Hours:** Rolling sum of consecutive hours where UTCI > 32°C.
- **Daily Peak:** Maximum daily UTCI and WBGT in IST.
- **Persistence:** Boolean flag if $T_{min}$ > 28°C AND Daily Peak UTCI > 38°C.

## 6. Validation Specification
- **Independent Reference Cases:** Compare outputs against independent hand-calculated reference values.
- **Dimensional/Unit Checks:** Ensure absolute Kelvin ($K$), Celsius (°C), and Flux ($W/m^2$) are strictly isolated and tested.
- **Monotonicity Tests:** Verify UTCI and WBGT respond monotonically to increased radiant load while holding other variables constant.
- **Nighttime/Daytime Radiation Response:** Assert nighttime negligible-solar condition approaches the chosen radiative baseline ($T_{mrt} \approx T_a$). Assert daytime solar loading produces increased $T_{mrt}$ relative to comparable low-radiation conditions.
- **Extreme-Value Sanity Checks:** Assert $T_{mrt}$ remains within physically plausible bounds (-10°C to +80°C).
- **Missing/NaN Propagation:** Assert any missing input strictly yields a missing output without silent fallback.

## 7. Implementation Order
1. Spatial ward $\rightarrow$ grid mapping
2. Radiation/Tmrt methodology
3. Outdoor WBGT methodology
4. UTCI integration
5. Thermal validation
6. Temporal features
7. HTSI prototype
8. HTSI sensitivity testing
9. Documentation
