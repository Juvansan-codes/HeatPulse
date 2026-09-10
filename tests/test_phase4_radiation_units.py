import pytest
import pandas as pd
import numpy as np
from pathlib import Path

TRUTH_PATH = Path("data/processed/weather/forecast_truth_2024_2025.parquet")
HINDCAST_PATH = Path("data/processed/weather/forecast_hindcast_raw_2024_2025.parquet")

def test_truth_radiation_conversion():
    assert TRUTH_PATH.exists(), "Truth dataset not found"
    df = pd.read_parquet(TRUTH_PATH)
    
    assert 'solar_radiation' in df.columns, "solar_radiation missing from truth"
    
    # 1. Check plausible bounds for W/m^2
    max_rad = df['solar_radiation'].max()
    assert max_rad < 1400, f"Max radiation {max_rad} W/m^2 exceeds solar constant (unphysical or J/m^2 mistake)"
    
    # 2. Check no systematic factor-of-3600 error
    # If the values were in J/m^2, daylight values would regularly exceed 1,000,000.
    assert max_rad > 500, f"Max radiation {max_rad} too low for Chennai daylight."
    
    # 3. Check nighttime radiation is approximately 0
    # Assuming local time (IST = UTC+5:30), night is approx UTC 14:00 to UTC 00:00
    df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True)
    night_mask = (df['timestamp'].dt.hour >= 15) | (df['timestamp'].dt.hour <= 0)
    night_rad = df.loc[night_mask, 'solar_radiation']
    
    assert night_rad.max() < 50, f"Nighttime radiation unusually high: {night_rad.max()} W/m^2"
    assert night_rad.mean() < 5, f"Nighttime mean radiation unusually high: {night_rad.mean()} W/m^2"
    
def test_hindcast_radiation_units():
    assert HINDCAST_PATH.exists(), "Hindcast dataset not found"
    df = pd.read_parquet(HINDCAST_PATH)
    
    # Test Day 1, 3, 5
    for day in [1, 3, 5]:
        col = f"shortwave_radiation_previous_day{day}"
        assert col in df.columns, f"{col} missing from hindcast"
        
        max_rad = df[col].max()
        assert max_rad < 1400, f"Max radiation for {col} is {max_rad} W/m^2 (exceeds physical limits)"
        assert max_rad > 500, f"Max radiation for {col} is {max_rad} W/m^2 (too low for Chennai daylight)"
        
        df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True)
        night_mask = (df['timestamp'].dt.hour >= 15) | (df['timestamp'].dt.hour <= 0)
        night_rad = df.loc[night_mask, col]
        
        assert night_rad.max() < 50, f"Nighttime radiation {col} high: {night_rad.max()}"
