import pytest
import pandas as pd
import numpy as np
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '../scripts'))
from phase2_step4_utci import compute_utci

def create_mock_df(t2m=30.0, tmrt=30.0, rh=50.0, ws10=2.0, num_rows=1):
    return pd.DataFrame({
        'temperature_2m': [t2m] * num_rows,
        'mean_radiant_temp': [tmrt] * num_rows,
        'relative_humidity': [rh] * num_rows,
        'wind_speed_10m': [ws10] * num_rows
    })

def test_neutral_radiation_case():
    # Test 6: Tmrt = Ta neutral-radiation case.
    df = create_mock_df(t2m=25.0, tmrt=25.0, rh=50.0, ws10=1.0)
    out = compute_utci(df)
    utci = out['utci'].iloc[0]
    # At Ta=25, Tmrt=25, RH=50%, v=1.0m/s, UTCI should be very close to Ta (~24-25C)
    assert 23.0 < utci < 26.0

def test_increased_tmrt():
    # Test 7: Increased Tmrt -> increased UTCI
    df_base = create_mock_df(t2m=30.0, tmrt=30.0)
    df_hot = create_mock_df(t2m=30.0, tmrt=50.0)
    utci_base = compute_utci(df_base)['utci'].iloc[0]
    utci_hot = compute_utci(df_hot)['utci'].iloc[0]
    assert utci_hot > utci_base

def test_increased_wind_hot():
    # Test 8: Increased wind -> generally lower UTCI under hot conditions
    df_calm = create_mock_df(t2m=35.0, tmrt=45.0, ws10=0.5)
    df_windy = create_mock_df(t2m=35.0, tmrt=45.0, ws10=10.0)
    utci_calm = compute_utci(df_calm)['utci'].iloc[0]
    utci_windy = compute_utci(df_windy)['utci'].iloc[0]
    assert utci_windy < utci_calm

def test_increased_humidity_hot():
    # Test 9: Increased humidity -> generally higher UTCI under hot conditions
    df_dry = create_mock_df(t2m=35.0, tmrt=35.0, rh=20.0)
    df_humid = create_mock_df(t2m=35.0, tmrt=35.0, rh=80.0)
    utci_dry = compute_utci(df_dry)['utci'].iloc[0]
    utci_humid = compute_utci(df_humid)['utci'].iloc[0]
    assert utci_humid > utci_dry

def test_cold_sanity():
    # Test 10: Cold-condition sanity check
    df = create_mock_df(t2m=-10.0, tmrt=-15.0, rh=50.0, ws10=5.0)
    out = compute_utci(df)
    utci = out['utci'].iloc[0]
    assert utci < -10.0 # Wind chill should make it colder

def test_extreme_hot_sanity():
    # Test 11: Extreme-hot-condition sanity check
    df = create_mock_df(t2m=45.0, tmrt=65.0, rh=80.0, ws10=1.0)
    out = compute_utci(df)
    utci = out['utci'].iloc[0]
    assert utci > 50.0 # Should be lethally hot

def test_nan_handling():
    # Test 12: NaN/missing-value handling
    df = create_mock_df(t2m=np.nan)
    out = compute_utci(df)
    assert np.isnan(out['utci'].iloc[0])

def test_wind_speed_convention():
    # Test 5: Wind-speed convention verification (clipping to 0.5)
    df_calm = create_mock_df(ws10=0.1) # below 0.5
    out = compute_utci(df_calm)
    assert out['utci_wind_speed'].iloc[0] == 0.5

def test_vapor_pressure_units():
    # Test 4: Vapour-pressure unit verification (should be in kPa ~1-4)
    df = create_mock_df(t2m=30.0, rh=50.0)
    out = compute_utci(df)
    vp = out['utci_vapor_pressure'].iloc[0]
    # At 30C, saturation VP ~ 4.24 kPa. 50% RH -> ~2.12 kPa
    assert 2.0 < vp < 2.3

def test_grid_level_preservation():
    # Tests 15 & 16: Exactly 5 grid cells, No ward-level duplication
    df = create_mock_df(num_rows=5)
    out = compute_utci(df)
    assert len(out) == 5
    assert 'utci' in out.columns
