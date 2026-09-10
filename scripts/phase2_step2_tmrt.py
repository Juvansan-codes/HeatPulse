import pandas as pd
import numpy as np

# --- CONSTANTS (ISO 7726 / VDI 3787 Part 2) ---
SIGMA = 5.67e-8         # Stefan-Boltzmann constant (W/m^2 K^4)
ALPHA_K = 0.70          # Shortwave absorption coefficient (clothed human)
EPSILON_P = 0.97        # Longwave emissivity (clothed human)
ALPHA_S = 0.20          # Urban surface albedo
EPSILON_S = 0.95        # Urban surface emissivity
SOLAR_CONSTANT = 1367.0 # W/m^2

def calculate_solar_geometry(df, lat_col='latitude', lon_col='longitude', time_col='timestamp'):
    """Calculate solar zenith and elevation using Spencer (1971). Timestamps must be UTC."""
    # ERA5 radiation is accumulated over the preceding hour.
    # We must calculate solar geometry at the midpoint of the accumulation period (T - 30 mins)
    # to avoid unphysical direct radiation spikes at sunrise/sunset.
    dti = pd.DatetimeIndex(df[time_col]) - pd.Timedelta(minutes=30)
    day_of_year = dti.dayofyear
    hour = dti.hour + dti.minute / 60.0 + dti.second / 3600.0

    gamma = (2 * np.pi / 365) * (day_of_year - 1 + (hour - 12) / 24)

    eqtime = 229.18 * (
        0.000075 +
        0.001868 * np.cos(gamma) -
        0.032077 * np.sin(gamma) -
        0.014615 * np.cos(2 * gamma) -
        0.040849 * np.sin(2 * gamma)
    )

    decl = (
        0.006918 -
        0.399912 * np.cos(gamma) +
        0.070257 * np.sin(gamma) -
        0.006758 * np.cos(2 * gamma) +
        0.000907 * np.sin(2 * gamma) -
        0.002697 * np.cos(3 * gamma) +
        0.00148 * np.sin(3 * gamma)
    )

    time_offset = eqtime + 4 * df[lon_col]
    tst = hour * 60 + time_offset
    
    ha = (tst / 4) - 180
    ha_rad = np.radians(ha)
    lat_rad = np.radians(df[lat_col])
    
    cos_zenith = (np.sin(lat_rad) * np.sin(decl) +
                  np.cos(lat_rad) * np.cos(decl) * np.cos(ha_rad))
    cos_zenith = np.clip(cos_zenith, -1.0, 1.0)
    zenith_rad = np.arccos(cos_zenith)
    zenith_deg = np.degrees(zenith_rad)
    elevation_deg = 90.0 - zenith_deg
    
    # Calculate extraterrestrial radiation (I0)
    I0 = SOLAR_CONSTANT * (1.00011 + 0.034221 * np.cos(gamma) + 0.001280 * np.sin(gamma) +
                           0.000719 * np.cos(2 * gamma) + 0.000077 * np.sin(2 * gamma))
    
    return zenith_rad, zenith_deg, elevation_deg, I0

def compute_tmrt(df):
    """Computes Tmrt strictly following the approved ISO 7726 formulation."""
    df = df.copy()

    # 1. Solar Geometry
    zenith_rad, zenith_deg, elevation_deg, I0 = calculate_solar_geometry(df)
    df['solar_zenith_deg'] = zenith_deg
    df['solar_elevation_deg'] = elevation_deg
    
    # 2. Extraterrestrial Horizontal Radiation
    cos_zenith = np.cos(zenith_rad)
    G0 = I0 * cos_zenith
    G0 = np.where(cos_zenith > 0, G0, 0)
    
    # 3. Clearness Index
    ghi = df['solar_radiation'].clip(lower=0) # ensure non-negative
    kt = np.zeros_like(ghi)
    valid_kt = G0 > 0
    kt[valid_kt] = ghi[valid_kt] / G0[valid_kt]
    kt = np.clip(kt, 0.0, 1.0)
    df['clearness_index'] = kt
    
    # 4. Diffuse Fraction (Erbs 1982)
    diffuse_fraction = np.zeros_like(kt)
    
    mask1 = kt <= 0.22
    mask2 = (kt > 0.22) & (kt <= 0.80)
    mask3 = kt > 0.80
    
    diffuse_fraction[mask1] = 1.0 - 0.09 * kt[mask1]
    diffuse_fraction[mask2] = (0.9511 - 0.1604 * kt[mask2] + 4.388 * (kt[mask2]**2) - 
                               16.638 * (kt[mask2]**3) + 12.336 * (kt[mask2]**4))
    diffuse_fraction[mask3] = 0.165
    diffuse_fraction = np.clip(diffuse_fraction, 0.0, 1.0)
    df['diffuse_fraction'] = diffuse_fraction
    
    # 5. Direct and Diffuse Radiation
    K_diff = ghi * diffuse_fraction
    # Direct horizontal
    K_dir_horiz = ghi - K_diff
    # Direct normal (perpendicular to sun rays)
    # prevent div by zero when sun is at horizon
    cos_z_safe = np.where(cos_zenith < 0.01745, 0.01745, cos_zenith) # limit to ~1 degree elevation
    K_dir = K_dir_horiz / cos_z_safe
    
    # Cap direct normal radiation to a physical maximum (e.g., 90% of extraterrestrial)
    # If capped, re-allocate the excess horizontal energy back into diffuse to maintain exact energy balance.
    max_k_dir = I0 * 0.9
    cap_mask = K_dir > max_k_dir
    if np.any(cap_mask):
        K_dir = np.where(cap_mask, max_k_dir, K_dir)
        new_k_dir_horiz = K_dir * cos_z_safe
        K_diff = np.where(cap_mask, ghi - new_k_dir_horiz, K_diff)
        K_dir_horiz = np.where(cap_mask, new_k_dir_horiz, K_dir_horiz)
    
    # Set direct radiation to 0 if sun is below horizon, assigning any residual twilight GHI entirely to diffuse
    night_mask = elevation_deg <= 0
    K_dir = np.where(night_mask, 0.0, K_dir)
    K_dir_horiz = np.where(night_mask, 0.0, K_dir_horiz)
    K_diff = np.where(night_mask, ghi, K_diff)
    ghi_safe = ghi
    
    df['direct_horizontal_radiation'] = K_dir_horiz
    df['diffuse_horizontal_radiation'] = K_diff
    df['reflected_radiation'] = ghi_safe * ALPHA_S
    
    # 6. Projected Area Factor (VDI 3787)
    fp = 0.308 * np.sin(zenith_rad) + 0.043 * np.cos(zenith_rad)
    fp = np.clip(fp, 0.043, 0.308) # strictly bound
    
    # 7. Longwave Radiation
    Ta_K = df['temperature_2m'] + 273.15
    # Actual vapor pressure from dew point (d2m in Celsius)
    ea = 6.112 * np.exp((17.67 * df['dew_point_2m']) / (df['dew_point_2m'] + 243.5))
    
    # Sky emissivity (Brutsaert)
    eps_sky = 1.24 * (ea / Ta_K)**(1/7)
    eps_sky = np.clip(eps_sky, 0.0, 1.0)
    
    L_down = eps_sky * SIGMA * (Ta_K**4)
    L_up = EPSILON_S * SIGMA * (Ta_K**4)
    
    df['longwave_down'] = L_down
    df['longwave_up'] = L_up
    
    # 8. Absorbed Radiation
    S_abs = ALPHA_K * (fp * K_dir + 0.5 * K_diff + 0.5 * df['reflected_radiation'])
    L_abs = EPSILON_P * (0.5 * L_down + 0.5 * L_up)
    
    df['absorbed_shortwave'] = S_abs
    df['absorbed_longwave'] = L_abs
    df['absorbed_radiation'] = S_abs + L_abs
    
    # 9. Tmrt
    Tmrt_K = (df['absorbed_radiation'] / (EPSILON_P * SIGMA))**0.25
    df['mean_radiant_temp'] = Tmrt_K - 273.15
    
    return df

if __name__ == "__main__":
    from pathlib import Path
    INPUT_FILE = Path("data/processed/weather/chennai_era5_2014_2023.parquet")
    OUTPUT_FILE = Path("data/processed/weather/thermal_step2_tmrt_2014_2023.parquet")
    REPORT_FILE = Path("docs/phase2_step2_tmrt_validation.md")
    
    print("Loading data...")
    df = pd.read_parquet(INPUT_FILE)
    
    print("Computing Tmrt...")
    df_out = compute_tmrt(df)
    
    print("Saving to parquet...")
    df_out.to_parquet(OUTPUT_FILE, index=False)
    
    # Stats
    n_rows = len(df_out)
    n_cells = df_out.groupby(['latitude', 'longitude']).ngroups
    
    day_mask = df_out['solar_elevation_deg'] > 0
    tmrt = df_out['mean_radiant_temp']
    
    stats = {
        'min': tmrt.min(),
        'max': tmrt.max(),
        'mean': tmrt.mean(),
        'night_mean': tmrt[~day_mask].mean(),
        'day_mean': tmrt[day_mask].mean()
    }
    
    suspicious = df_out[(tmrt < -10) | (tmrt > 80)]
    n_suspicious = len(suspicious)
    
    report = f"""# Phase 2 Step 2: Tmrt Validation Report

## 1. Overview
- **Rows Processed:** {n_rows}
- **Grid Cells Processed:** {n_cells}
- **Temporal Coverage:** {df_out['timestamp'].min()} to {df_out['timestamp'].max()}

## 2. Tmrt Statistics (°C)
- **Min:** {stats['min']:.2f}
- **Max:** {stats['max']:.2f}
- **Mean:** {stats['mean']:.2f}
- **Nighttime Mean:** {stats['night_mean']:.2f}
- **Daytime Mean:** {stats['day_mean']:.2f}

## 3. Physical Sanity Checks
- **Suspicious/Out-of-bound Values (<-10°C or >80°C):** {n_suspicious}
"""
    with open(REPORT_FILE, "w") as f:
        f.write(report)
        
    print(f"Report saved to {REPORT_FILE}")
