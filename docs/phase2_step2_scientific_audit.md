# Phase 2 Step 2: Tmrt Scientific Audit

## 1. Nighttime Tmrt (Radiative Cooling)
- **Ta Night:** min = 15.76°C, mean = 26.15°C
- **Tmrt Night:** min = 7.38°C, mean = 19.77°C
- **Tmrt - Ta Difference:** min = -8.79°C, mean = -6.38°C

**Distribution of Nighttime (Tmrt - Ta) out of 219,130 night observations:**
- 0 to -5°C: 297 (0.14%)
- -5 to -10°C: 218,833 (99.86%)
- < -10°C: 0 (0%)

**Verdict: Physically Plausible.** Nighttime $T_{mrt}$ is driven purely by longwave radiation. Upward longwave matches $T_a$, but downward longwave is governed by clear-sky emissivity ($\epsilon_{sky} < 1.0$) under the Brutsaert approximation. Therefore, the net longwave balance is strictly negative, resulting in a consistent and physically accurate radiative cooling effect of ~6°C below air temperature.

## 2. Extreme Tmrt Values
- **Top 20 Highest:** Occurred exclusively during May/April heatwaves near noon. $T_a$ ~40-42°C, GHI ~650-850 $W/m^2$. $T_{mrt}$ peaks between 62.2°C and 62.9°C.
- **Top 20 Lowest:** Occurred exclusively during January/February midnight/early morning hours. $T_a$ ~15.7-16.5°C, high RH (95-99%), GHI = 0. $T_{mrt}$ drops to 7.3°C - 8.3°C due to radiative cooling.

**Verdict: Physically Plausible.** A peak $T_{mrt}$ of ~63°C under direct midday tropical sun over an asphalt-assumed urban surface ($T_s \approx T_a$) is well within standard biometeorological bounds for unshaded exposure.

## 3. Midpoint Solar-Geometry Fix
**Instability Demonstrated:** In initial tests, calculating solar geometry at the exact ERA5 timestamp (the *end* of the hourly accumulation period) caused $T_{mrt}$ to spike to 108°C. This occurred at the twilight hour (e.g. 13:00 UTC) because the sun was exactly on the horizon at 13:00 ($\cos(\theta_z) \approx 0$), but the accumulated $GHI$ represented the hour 12:00-13:00 when the sun was higher. Dividing a large $GHI$ by a near-zero $\cos(\theta_z)$ caused the Direct Normal Irradiance (DNI) to explode to >2700 $W/m^2$ (physically impossible).
**Fix:** By calculating the geometry at the *midpoint* of the hour (T - 30 mins), the solar angle correctly matched the average energy received. The maximum uncapped DNI safely dropped to 1094 $W/m^2$, completely removing the mathematical singularity.

## 4. DNI Cap Analysis
- **Cap Rule:** DNI $\le 0.9 \times I_0$ (extraterrestrial radiation).
- **Total daytime obs hitting cap:** 0 (0.00%)
- **Max uncapped DNI:** 1094.11 $W/m^2$
- **Max capped DNI:** 1094.11 $W/m^2$

**Verdict: Numerical Stability Safeguard.** The DNI cap is currently 100% inactive across all 438,240 hours. It serves strictly as a mathematical safety net against anomalous twilight geometry boundaries. Because of the midpoint fix, the native derivation remains naturally bounded and physically sound.

## 5. Energy Conservation
- **Verification:** $GHI \approx K_{dir\_horiz} + K_{diff\_horiz}$
- **Maximum Error:** $1.11 \times 10^{-3} \, W/m^2$

**Verdict: Exact Energy Conservation.** The direct/diffuse splitting algorithm and twilight handlers perfectly conserve the original ERA5 GHI, ensuring no energy is arbitrarily deleted or fabricated.

## 6. Tmrt Response (Synthetic Sensitivity)
Controlled experiments on the radiation engine yield the following:
- **A. Higher Solar Load:** 500 $W/m^2 \rightarrow$ 800 $W/m^2$ increases $T_{mrt}$ (+1.83°C at noon when $f_p$ is minimal).
- **B. Higher Humidity:** $T_d$ 25°C $\rightarrow$ 30°C increases $T_{mrt}$ (+1.20°C) by increasing clear-sky emissivity and downward longwave flux.
- **C. Lower Sun Angle:** Noon $\rightarrow$ Early Morning (holding GHI at 500 $W/m^2$) massively increases $T_{mrt}$ (+23.51°C) because the projected area factor ($f_p$) for a standing human increases from ~0.04 to ~0.30, exposing the full body to the direct beam.
- **D. Day vs Night:** 0 vs 1000 $W/m^2$ at constant $T_a$ yields a +28.28°C differential.

**Verdict: Physically Plausible.** The engine responds correctly to shortwave loading, longwave atmospheric thickening (humidity), and human posture radiation geometry.

## 7. Spatial Consistency
| Latitude | Mean | Median | 5th Pct | 95th Pct | Max |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 12.8 | 32.96 | 23.93 | 16.31 | 57.14 | 61.84 |
| 12.9 | 32.88 | 23.91 | 15.88 | 57.40 | 62.38 |
| 13.0 | 32.80 | 23.90 | 15.54 | 57.56 | 62.62 |
| 13.1 | 32.80 | 23.91 | 15.39 | 57.67 | 62.94 |
| 13.2 | 32.87 | 23.97 | 15.47 | 57.60 | 62.77 |

**Verdict: Highly Consistent.** The 5 ERA5 cells show <0.2°C variance in mean $T_{mrt}$, reflecting realistic mesoscale coastal-urban gradients across the ~50km north-south span of Chennai without any spatial anomalies.

## FINAL VERDICT
**PASS — Tmrt scientifically acceptable for Step 3.** 

The radiation balance model strictly conforms to ISO 7726 principles. The midpoint geometry shift successfully eliminated twilight singularities, preserving strict GHI energy conservation without requiring active DNI clipping. The nighttime radiative cooling and human geometric responses are physically sound.
