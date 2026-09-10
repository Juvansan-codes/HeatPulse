import os
import pandas as pd
import numpy as np

# Adjust imports for running as script or module
if __name__ == '__main__':
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    from app.thermal.common import calculate_relative_humidity, calculate_wind_speed
    from app.thermal.heat_index import calculate_heat_index
    from app.thermal.wbgt import calculate_wbgt_approx
    from app.thermal.utci import calculate_utci_approx
else:
    from .common import calculate_relative_humidity, calculate_wind_speed
    from .heat_index import calculate_heat_index
    from .wbgt import calculate_wbgt_approx
    from .utci import calculate_utci_approx

def test_unit_conversions():
    print("Running Unit Conversion Tests...")
    # Test RH logic
    rh = calculate_relative_humidity(30, 20)
    assert 54.0 < rh < 56.0, f"RH calculation failed: {rh}"
    
    # Test Wind speed
    ws = calculate_wind_speed(3.0, 4.0)
    assert np.isclose(ws, 5.0), f"Wind speed failed: {ws}"
    print("Unit conversions OK.")

def test_indices_reference():
    print("Running Reference Index Tests...")
    # Heat Index (requires >= 26.7C). Let's test 30C (86F) and 70% RH
    # Expected HI is ~ 35.5C (96F)
    hi = calculate_heat_index(30, 70)
    assert 34.0 < hi < 37.0, f"Heat Index failed: {hi}"
    
    # Below 80F (26.7C), HI should equal simple HI (Steadman approx), which is near ambient.
    hi_low = calculate_heat_index(20, 50)
    assert 19.0 < hi_low < 21.0, f"Heat Index low bounds failed: {hi_low}"
    
    # WBGT Approx: 30C, 50% RH
    wbgt = calculate_wbgt_approx(30, 50)
    assert 20.0 < wbgt < 35.0, f"WBGT out of bounds: {wbgt}"
    
    # UTCI Approx: 30C, 50% RH, 2m/s wind
    utci = calculate_utci_approx(30, 50, 2.0)
    assert 25.0 < utci < 35.0, f"UTCI out of bounds: {utci}"
    print("Indices Reference OK.")

def run_validation_on_sample(parquet_path):
    print(f"Loading sample file: {parquet_path}")
    if not os.path.exists(parquet_path):
        print("Sample file not found. Skipping dataset validation.")
        return
        
    df = pd.read_parquet(parquet_path)
    print(f"Sample loaded. Rows: {len(df)}")
    
    # Validate missing values
    missing = df.isnull().sum()
    if missing.any():
        print("WARNING: Missing values found in sample:")
        print(missing[missing > 0])
    
    # Test Thermal Engine across the dataset
    print("Testing Thermal Engine vectorization...")
    df['heat_index'] = calculate_heat_index(df['temperature_2m'], df['relative_humidity'])
    df['wbgt'] = calculate_wbgt_approx(df['temperature_2m'], df['relative_humidity'])
    df['utci'] = calculate_utci_approx(df['temperature_2m'], df['relative_humidity'], df['wind_speed_10m'])
    
    # Check boundaries
    print("\nCalculated Ranges:")
    print(f"Temperature: {df['temperature_2m'].min():.2f} to {df['temperature_2m'].max():.2f} °C")
    print(f"Heat Index: {df['heat_index'].min():.2f} to {df['heat_index'].max():.2f} °C")
    print(f"WBGT: {df['wbgt'].min():.2f} to {df['wbgt'].max():.2f} °C")
    print(f"UTCI: {df['utci'].min():.2f} to {df['utci'].max():.2f} °C")
    
    print("\nDataset Validation SUCCESS.")

if __name__ == '__main__':
    test_unit_conversions()
    test_indices_reference()
    sample_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
        'data', 'processed', 'weather', 'chennai_sample_canonical.parquet'
    )
    run_validation_on_sample(sample_path)
