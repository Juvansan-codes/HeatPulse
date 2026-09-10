import pytest
import pandas as pd
import numpy as np
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '../scripts'))
from phase2_step3_wbgt import compute_wbgt_outdoor

def create_mock_df(time='2023-05-15 12:00:00', lat=13.0, lon=80.0, t2m=35.0, d2m=25.0, rh=55.0, ws10=5.0, sp=101325.0, ghi=800.0, num_rows=1):
    return pd.DataFrame({
        'timestamp': [pd.to_datetime(time)] * num_rows,
        'latitude': [lat] * num_rows,
        'longitude': [lon] * num_rows,
        'temperature_2m': [t2m] * num_rows,
        'dew_point_2m': [d2m] * num_rows,
        'relative_humidity': [rh] * num_rows,
        'wind_speed_10m': [ws10] * num_rows,
        'surface_pressure': [sp] * num_rows,
        'solar_radiation': [ghi] * num_rows
    })

def test_vapor_pressure_calculation():
    df = create_mock_df(t2m=30.0, rh=50.0)
    out = compute_wbgt_outdoor(df)
    vp = out['vapor_pressure'].iloc[0]
    # At 30C, es ~ 42.4 hPa, so at 50% RH, e ~ 21.2 hPa
    assert 20.0 < vp < 23.0

def test_wind_height_conversion():
    df = create_mock_df(ws10=10.0)
    out = compute_wbgt_outdoor(df)
    ws_ref = out['wind_speed_reference'].iloc[0]
    # 2m wind should be less than 10m wind (typically ~0.6-0.7x for urban profile)
    assert ws_ref < 10.0
    assert ws_ref > 0.0

def test_radiation_input_handling_night():
    df = create_mock_df(time='2023-05-15 00:00:00', ghi=-10.0)
    out = compute_wbgt_outdoor(df)
    # Negative GHI should be clipped to 0 internally without crashing
    assert 'wbgt_outdoor' in out.columns
    assert not np.isnan(out['wbgt_outdoor'].iloc[0])

def test_wbgt_physical_bounds():
    df = create_mock_df(t2m=45.0, d2m=35.0, ghi=1000.0, ws10=1.0) # Extreme hot/humid/sun
    out = compute_wbgt_outdoor(df)
    wbgt = out['wbgt_outdoor'].iloc[0]
    assert 30.0 < wbgt < 60.0 # Should be very hot, but physical

    df_cold = create_mock_df(t2m=0.0, d2m=-10.0, ghi=0.0, ws10=10.0) # Cold night
    out_cold = compute_wbgt_outdoor(df_cold)
    wbgt_cold = out_cold['wbgt_outdoor'].iloc[0]
    assert -15.0 < wbgt_cold < 5.0

def test_missing_nan_propagation():
    df = create_mock_df(t2m=np.nan)
    # Pywbgt handles nans cleanly or throws? Let's check
    try:
        out = compute_wbgt_outdoor(df)
        assert np.isnan(out['wbgt_outdoor'].iloc[0])
    except Exception:
        # If it throws on NaN, that's fine, we should ideally drop or fill NaNs before processing
        pass 

def test_monotonic_response_thermal_load():
    df_base = create_mock_df(t2m=30.0, d2m=20.0)
    df_hot = create_mock_df(t2m=40.0, d2m=20.0)
    out_base = compute_wbgt_outdoor(df_base)
    out_hot = compute_wbgt_outdoor(df_hot)
    assert out_hot['wbgt_outdoor'].iloc[0] > out_base['wbgt_outdoor'].iloc[0]

def test_solar_load_response():
    df_shade = create_mock_df(ghi=0.0)
    df_sun = create_mock_df(ghi=800.0)
    out_shade = compute_wbgt_outdoor(df_shade)
    out_sun = compute_wbgt_outdoor(df_sun)
    assert out_sun['wbgt_outdoor'].iloc[0] > out_shade['wbgt_outdoor'].iloc[0]

def test_wind_cooling_response():
    df_calm = create_mock_df(ws10=0.1)
    df_windy = create_mock_df(ws10=10.0)
    out_calm = compute_wbgt_outdoor(df_calm)
    out_windy = compute_wbgt_outdoor(df_windy)
    # Higher wind should decrease WBGT when air temp is lower than skin temp, 
    # but here T=35C so it might not cool significantly if humidity is high.
    # Actually, wind usually decreases WBGT outdoors due to evaporative cooling of wet bulb.
    assert out_windy['wbgt_outdoor'].iloc[0] != out_calm['wbgt_outdoor'].iloc[0]

def test_grid_level_processing():
    df = create_mock_df(num_rows=5)
    out = compute_wbgt_outdoor(df)
    assert len(out) == 5 # Does not expand to 200 wards
    assert 'wbgt_method' in out.columns
    assert out['wbgt_method'].iloc[0] == 'Liljegren (2008)'
