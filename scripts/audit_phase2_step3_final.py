import pandas as pd
import numpy as np

def run_audit():
    df = pd.read_parquet('data/processed/weather/thermal_step3_wbgt_2014_2023.parquet')
    
    print("--- 1. MAX WBGT CASE ---")
    max_idx = df['wbgt_outdoor'].idxmax()
    max_row = df.loc[max_idx]
    cols = ['timestamp', 'latitude', 'temperature_2m', 'relative_humidity', 'wind_speed_10m', 'wind_speed_reference', 'solar_radiation', 'surface_pressure', 'wbgt_outdoor']
    print(df.loc[[max_idx], cols].to_string(index=False))
    
    print("\n--- 2. WIND SPEED CONVERSION ---")
    ws10 = df['wind_speed_10m']
    ws2 = df['wind_speed_reference']
    print(f"10m Wind Speed Range: {ws10.min():.2f} to {ws10.max():.2f} m/s (Mean: {ws10.mean():.2f})")
    print(f"2m Adjusted Wind Speed Range: {ws2.min():.2f} to {ws2.max():.2f} m/s (Mean: {ws2.mean():.2f})")
    print(f"Average Reduction Ratio: {(ws2 / np.where(ws10==0, 1, ws10)).mean():.4f}")

if __name__ == '__main__':
    run_audit()
