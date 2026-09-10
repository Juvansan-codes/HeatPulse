import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add scripts directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../scripts'))
from phase2_step2_tmrt import compute_tmrt, calculate_solar_geometry, SIGMA, EPSILON_P

def create_synthetic_data(time, lat=13.0, lon=80.2, t2m=30.0, d2m=25.0, ssrd=500.0):
    return pd.DataFrame({
        'timestamp': pd.to_datetime([time]),
        'latitude': [lat],
        'longitude': [lon],
        'temperature_2m': [t2m],
        'dew_point_2m': [d2m],
        'solar_radiation': [ssrd]
    })

def test_solar_geometry_night():
    # Midnight in Chennai (18:30 UTC)
    df = create_synthetic_data('2023-05-15 18:30:00')
    zenith_rad, zenith_deg, elevation_deg, I0 = calculate_solar_geometry(df)
    assert elevation_deg.iloc[0] < 0, "Nighttime elevation should be below horizon."

def test_solar_geometry_day():
    # Noon in Chennai (06:30 UTC)
    df = create_synthetic_data('2023-05-15 06:30:00')
    zenith_rad, zenith_deg, elevation_deg, I0 = calculate_solar_geometry(df)
    assert elevation_deg.iloc[0] > 0, "Daytime elevation should be positive."

def test_radiation_nonnegative():
    df = create_synthetic_data('2023-05-15 06:30:00', ssrd=800.0)
    out = compute_tmrt(df)
    assert (out['diffuse_horizontal_radiation'] >= 0).all()
    assert (out['direct_horizontal_radiation'] >= 0).all()
    assert (out['reflected_radiation'] >= 0).all()
    assert (out['absorbed_shortwave'] >= 0).all()
    assert (out['absorbed_longwave'] >= 0).all()

def test_direct_diffuse_energy_balance():
    df = create_synthetic_data('2023-05-15 06:30:00', ssrd=800.0)
    out = compute_tmrt(df)
    ghi = out['solar_radiation'].iloc[0]
    direct_h = out['direct_horizontal_radiation'].iloc[0]
    diffuse_h = out['diffuse_horizontal_radiation'].iloc[0]
    assert np.isclose(ghi, direct_h + diffuse_h), "GHI must equal direct_horizontal + diffuse_horizontal"

def test_tmrt_nighttime():
    df = create_synthetic_data('2023-05-15 18:30:00', ssrd=0.0, t2m=25.0, d2m=20.0)
    out = compute_tmrt(df)
    tmrt = out['mean_radiant_temp'].iloc[0]
    # At night with no solar, Tmrt is driven by longwave balance.
    # L_up = T_a. L_down < T_a (since eps_sky < 1). 
    # Therefore L_abs < eps_p * sigma * Ta^4. Tmrt should be slightly below Ta.
    assert tmrt <= 25.0, f"Nighttime Tmrt ({tmrt}) should be <= Ta (25.0) under clear sky."

def test_tmrt_daytime_response():
    df_low = create_synthetic_data('2023-05-15 06:30:00', ssrd=200.0, t2m=30.0, d2m=25.0)
    df_high = create_synthetic_data('2023-05-15 06:30:00', ssrd=800.0, t2m=30.0, d2m=25.0)
    
    out_low = compute_tmrt(df_low)
    out_high = compute_tmrt(df_high)
    
    assert out_high['mean_radiant_temp'].iloc[0] > out_low['mean_radiant_temp'].iloc[0], "Higher solar radiation must produce higher Tmrt."
    assert out_high['mean_radiant_temp'].iloc[0] > 30.0, "Daytime Tmrt with strong sun should exceed Ta."

def test_tmrt_physical_bounds():
    df = create_synthetic_data('2023-05-15 06:30:00', ssrd=1200.0, t2m=45.0, d2m=30.0)
    out = compute_tmrt(df)
    tmrt = out['mean_radiant_temp'].iloc[0]
    assert -10 <= tmrt <= 80, f"Tmrt {tmrt} is outside physically plausible bounds."

def test_nan_propagation():
    df = create_synthetic_data('2023-05-15 06:30:00', ssrd=np.nan)
    out = compute_tmrt(df)
    assert np.isnan(out['mean_radiant_temp'].iloc[0]), "NaN in solar_radiation must propagate to Tmrt."

def test_kelvin_celsius_conversion():
    df = create_synthetic_data('2023-05-15 06:30:00', ssrd=0.0, t2m=0.0)
    out = compute_tmrt(df)
    # At T=0C with 0 solar, L_down = eps * sigma * 273.15^4
    # The math must not crash with Negative Kelvin roots.
    assert not np.isnan(out['mean_radiant_temp'].iloc[0])

def test_grid_level_processing():
    # Feed 2 rows to represent 2 grid cells
    df = pd.DataFrame({
        'timestamp': pd.to_datetime(['2023-05-15 06:30:00', '2023-05-15 06:30:00']),
        'latitude': [13.0, 13.1],
        'longitude': [80.2, 80.2],
        'temperature_2m': [30.0, 31.0],
        'dew_point_2m': [25.0, 25.0],
        'solar_radiation': [500.0, 500.0]
    })
    out = compute_tmrt(df)
    assert len(out) == 2, "Processing must preserve the exact number of input grid cells (no ward expansion)."
    assert 'latitude' in out.columns and 'longitude' in out.columns
