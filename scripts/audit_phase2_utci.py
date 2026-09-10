import pandas as pd
import numpy as np
import time

def run_utci_audit():
    print("Loading data...")
    t0 = time.time()
    df = pd.read_parquet('data/processed/weather/thermal_step4_utci_2014_2023.parquet')
    
    print("\n--- 10-YEAR UTCI STATISTICS ---")
    utci = df['utci']
    print(f"Min: {utci.min():.2f}")
    print(f"Max: {utci.max():.2f}")
    print(f"Mean: {utci.mean():.2f}")
    print(f"Median: {utci.median():.2f}")
    print(f"5th Percentile: {utci.quantile(0.05):.2f}")
    print(f"95th Percentile: {utci.quantile(0.95):.2f}")
    print(f"Missing (NaN): {utci.isna().sum()}")
    
    suspicious_high = (utci > 60).sum()
    suspicious_low = (utci < -20).sum()
    print(f"Suspicious (>60C): {suspicious_high}")
    print(f"Suspicious (<-20C): {suspicious_low}")
    
    print("\n--- MAX UTCI CASE ---")
    max_idx = utci.idxmax()
    cols = ['timestamp', 'latitude', 'temperature_2m', 'mean_radiant_temp', 'relative_humidity', 'wind_speed_10m', 'utci_vapor_pressure', 'utci']
    print(df.loc[[max_idx], cols].to_string(index=False))
    
    print("\n--- REFERENCE VALIDATION ---")
    from pythermalcomfort.models import utci as ptc_utci
    
    def test_case(name, ta, tmrt, v, rh):
        calc = ptc_utci(tdb=ta, tr=tmrt, v=v, rh=rh).utci
        print(f"Case {name}: Ta={ta}, Tmrt={tmrt}, v={v}, RH={rh} | Calculated: {calc:.1f} °C")
    
    test_case("Neutral", 20, 20, 1.0, 50)
    test_case("Hot/Sun", 35, 55, 1.0, 50)
    test_case("Cold/Wind", -5, -5, 10.0, 50)
    
    t1 = time.time()
    print(f"\nRuntime: {t1-t0:.2f} seconds")
    print(f"Memory: DataFrame size {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")

if __name__ == "__main__":
    run_utci_audit()
