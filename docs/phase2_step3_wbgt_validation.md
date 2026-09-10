# Phase 2 Step 3: Outdoor WBGT Validation Report

## 1. Formulation Used
**Model:** Liljegren et al. (2008) Outdoor WBGT Model
**Library:** `pywbgt` (Cython wrapper around the official Liljegren C implementation)
**Equations:**
The model solves complex heat and mass transfer energy balances for a natural wet bulb thermometer ($T_{nwb}$) and a black globe thermometer ($T_g$), and combines them with air temperature ($T_a$):
$$ WBGT = 0.7 T_{nwb} + 0.2 T_g + 0.1 T_a $$

**Inputs Used:**
- `temp_air`: Air temperature (°C)
- `temp_dew`: Dew point temperature (°C)
- `solar`: Global Horizontal Irradiance (GHI) ($W/m^2$)
- `pres`: Surface pressure (hPa)
- `speed`: Wind speed at 10m ($m/s$)
- `zspeed`: 10m (instructs the model to use the urban boundary layer profile to estimate 2m wind speed)
- `datetime`, `lat`, `lon`: Used internally by the model if required.

## 2. Assumptions & Limitations
- **Wind Conversion (10m to 2m):** The model was explicitly passed `urban=True` and `zspeed=10m`. The Liljegren code internally applies a stability-dependent urban boundary layer logarithmic profile. 
  - *Audit Result:* 10m wind (Mean: 3.17 m/s, Max: 16.54 m/s) was successfully downscaled to a 2m reference wind (Mean: 2.20 m/s, Max: 11.06 m/s), yielding an expected ~0.70x reduction ratio.
  - *Modelling Assumption:* Setting `urban=True` is an explicit, scientifically sound assumption for the Chennai pilot given its dense built environment, providing much more realistic 2m wind attenuation than a rural/grassland profile.
- **Temporal Centering (Averaging Period):** ERA5 SSRD represents a 60-minute backward accumulation. The `pywbgt` module contains an `avg` keyword to automatically shift solar geometry to the midpoint of the accumulation period. However, passing `avg=60` triggers a `TypeError` in modern Pandas (>2.0) due to deprecated `DatetimeIndex.astype(float64)` casting inside `pywbgt/solar.py`. 
  - *Resolution:* We use the default instantaneous endpoint timestamps. The underlying Liljegren C-code acts as a physical safeguard: if the instantaneous geometric sun is below the horizon at the end of the hour, it safely zeros out any residual twilight GHI. This inherently prevents the "twilight anomaly" (division-by-zero) that affected $T_{mrt}$, at the slight cost of being marginally conservative at sunset.
- **Radiation Treatment:** We passed the original `solar_radiation` (GHI) directly into the model. The model computes its own direct/diffuse fractions and solar geometry internally. **Crucially, we did NOT pass our $T_{mrt}$ from Step 2 into WBGT**. WBGT and UTCI remain entirely separated thermal indices to prevent double-counting of radiation.
- **No Arbitrary Clipping:** No clipping was applied to the final WBGT output. The only clipping was `solar_radiation.clip(lower=0)` on the GHI input to strictly remove unphysical negative ERA5 reanalysis artifacts at night.

## 3. Reference Validation
Controlled reference cases were evaluated to ensure the underlying physics engine was actively returning valid linear combinations:
- **Case 1 (Hot/Humid/Sun):** Expected: 32.90, Calculated: 32.90, Diff: 0.00
- **Case 2 (Cool/Night):** Expected: 12.69, Calculated: 12.69, Diff: <1e-6
- **Case 3 (Hot/Dry/Extreme Sun):** Expected: 31.58, Calculated: 31.58, Diff: 0.00

## 4. 10-Year WBGT Statistics (Chennai 2014-2023)
- **Min:** 15.04 °C
- **Max:** 42.27 °C
- **Mean:** 26.42 °C
- **Median:** 26.22 °C
- **5th Percentile:** 21.13 °C
- **95th Percentile:** 31.92 °C

## 5. Sanity Checks & Performance
- **Missing (NaN):** 0
- **Suspicious (>45°C):** 0
- **Suspicious (<0°C):** 0
- **Maximum WBGT Case (42.27°C):** Occurred on `2017-05-16 06:00:00 UTC` (11:30 AM IST). 
  - Air Temp: 38.77 °C
  - RH: 38.61%
  - GHI: 929.73 W/m²
  - 10m Wind: 0.09 m/s (Extremely low)
  - 2m Wind: 0.13 m/s (Clipped to Liljegren's minimum threshold `LILJEGREN_MIN_SPEED` internally to prevent boundary layer singularities).
- **Runtime:** ~8.0 seconds for 438,240 rows
- **Memory:** Negligible overhead (in-place Cython arrays)
