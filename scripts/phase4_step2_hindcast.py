import os
import sys
import json
import time
import pandas as pd
import numpy as np
import openmeteo_requests
import requests_cache
from retry_requests import retry
from pathlib import Path

PROCESSED_WEATHER_DIR = Path("data/processed/weather")
VALIDATION_DIR = Path("data/validation/weather")
os.makedirs(PROCESSED_WEATHER_DIR, exist_ok=True)
os.makedirs(VALIDATION_DIR, exist_ok=True)

HINDCAST_OUT = PROCESSED_WEATHER_DIR / "forecast_hindcast_raw_2024_2025.parquet"
METADATA_OUT = PROCESSED_WEATHER_DIR / "forecast_hindcast_metadata.json"
REPORT_OUT = VALIDATION_DIR / "phase4_step2_baseline_report.json"
TRUTH_PATH = PROCESSED_WEATHER_DIR / "forecast_truth_2024_2025.parquet"

# Valid 5 ERA5-Land Chennai Grid Cells
GRID_CELLS = [
    (12.8, 80.2),
    (12.9, 80.2),
    (13.0, 80.2),
    (13.1, 80.2),
    (13.2, 80.2)
]

START_DATE = "2024-01-01"
END_DATE = "2025-12-31"

def fetch_hindcast_for_cell(lat, lon, client):
    url = "https://historical-forecast-api.open-meteo.com/v1/forecast"
    
    # We fetch day 1 to day 5 to be comprehensive, even though we focus on 3-5 day forecasting.
    # We also fetch 0-lead for reference.
    variables = [
        "temperature_2m",
        "relative_humidity_2m",
        "wind_speed_10m",
        "shortwave_radiation"
    ]
    
    hourly_vars = variables.copy()
    for day in [1, 2, 3, 4, 5]:
        for var in variables:
            hourly_vars.append(f"{var}_previous_day{day}")
            
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": START_DATE,
        "end_date": END_DATE,
        "hourly": hourly_vars,
        "models": "best_match",
        "timezone": "UTC",
        "wind_speed_unit": "ms"
    }
    
    print(f"   -> Fetching {lat}, {lon}...")
    responses = client.weather_api(url, params=params)
    response = responses[0]
    
    hourly = response.Hourly()
    time_range = pd.date_range(
        start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
        end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
        freq=pd.Timedelta(seconds=hourly.Interval()),
        inclusive="left"
    )
    
    df = pd.DataFrame({"timestamp": time_range})
    df["latitude"] = lat
    df["longitude"] = lon
    
    for i, var_name in enumerate(hourly_vars):
        df[var_name] = hourly.Variables(i).ValuesAsNumpy()
        
    return df

def run_extraction():
    print("Starting Phase 4 Step 2: Historical Hindcast Acquisition")
    
    if not TRUTH_PATH.exists():
        print(f"Error: Truth dataset not found at {TRUTH_PATH}")
        sys.exit(1)
    
    cache_session = requests_cache.CachedSession('.cache', expire_after=-1)
    retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
    openmeteo = openmeteo_requests.Client(session=retry_session)
    
    print("\n[1] DOWNLOADING HINDCASTS FROM OPEN-METEO (best_match)...")
    dfs = []
    for lat, lon in GRID_CELLS:
        df_cell = fetch_hindcast_for_cell(lat, lon, openmeteo)
        dfs.append(df_cell)
        
    df_all = pd.concat(dfs, ignore_index=True)
    df_all = df_all.sort_values(["latitude", "longitude", "timestamp"]).reset_index(drop=True)
    
    print(f"\nExtracted {len(df_all)} total rows.")
    
    print("\n[2] SAVING RAW HINDCAST DATASET...")
    df_all.to_parquet(HINDCAST_OUT, index=False)
    file_size_mb = os.path.getsize(HINDCAST_OUT) / 1024**2
    print(f"Saved {HINDCAST_OUT} (Size: {file_size_mb:.2f} MB)")
    
    meta = {
        "dataset_info": {
            "source": "Open-Meteo Historical Forecast API (best_match)",
            "extraction_timestamp": pd.Timestamp.now(tz='UTC').isoformat(),
            "time_range": {"start": START_DATE, "end": END_DATE},
        },
        "spatial": {
            "cells_extracted": len(GRID_CELLS)
        },
        "variables": df_all.columns.tolist()
    }
    with open(METADATA_OUT, 'w') as f:
        json.dump(meta, f, indent=4)
        
    print("\n[3] BASELINE VALIDATION (Day 3 vs Truth)...")
    df_truth = pd.read_parquet(TRUTH_PATH)
    df_truth['timestamp'] = pd.to_datetime(df_truth['timestamp'], utc=True).dt.floor('s')
    df_all['timestamp'] = pd.to_datetime(df_all['timestamp'], utc=True).dt.floor('s')
    
    # Round coordinates to avoid floating point mismatch
    df_truth['latitude'] = df_truth['latitude'].round(3)
    df_truth['longitude'] = df_truth['longitude'].round(3)
    df_all['latitude'] = df_all['latitude'].round(3)
    df_all['longitude'] = df_all['longitude'].round(3)
    
    # Merge Truth and Day 3 Forecast
    # Keep only the required columns to save memory
    truth_sub = df_truth[["timestamp", "latitude", "longitude", "temperature_2m", "solar_radiation", "relative_humidity", "wind_speed_10m"]].copy()
    truth_sub = truth_sub.rename(columns={
        "temperature_2m": "truth_t2m",
        "solar_radiation": "truth_rad",
        "relative_humidity": "truth_rh",
        "wind_speed_10m": "truth_wind"
    })
    
    merged = pd.merge(df_all, truth_sub, on=["timestamp", "latitude", "longitude"], how="inner")
    
    # Compute error metrics for Day 3
    # Radiation conversion (forecast might be W/m2, let's verify if we need to convert)
    # Open meteo shortwave radiation is W/m2
    merged['err_t2m'] = merged['temperature_2m_previous_day3'] - merged['truth_t2m']
    merged['err_rad'] = merged['shortwave_radiation_previous_day3'] - merged['truth_rad']
    merged['err_rh'] = merged['relative_humidity_2m_previous_day3'] - merged['truth_rh']
    merged['err_wind'] = merged['wind_speed_10m_previous_day3'] - merged['truth_wind']
    
    report = {
        "validation_rows": len(merged),
        "metrics_day3": {
            "temperature_2m": {
                "mean_error": float(merged['err_t2m'].mean()),
                "mae": float(merged['err_t2m'].abs().mean()),
                "rmse": float(np.sqrt((merged['err_t2m']**2).mean())),
                "correlation": float(merged['temperature_2m_previous_day3'].corr(merged['truth_t2m']))
            },
            "solar_radiation": {
                "mean_error": float(merged['err_rad'].mean()),
                "mae": float(merged['err_rad'].abs().mean()),
                "rmse": float(np.sqrt((merged['err_rad']**2).mean())),
                "correlation": float(merged['shortwave_radiation_previous_day3'].corr(merged['truth_rad']))
            },
            "relative_humidity": {
                "mean_error": float(merged['err_rh'].mean()),
                "mae": float(merged['err_rh'].abs().mean()),
                "rmse": float(np.sqrt((merged['err_rh']**2).mean())),
                "correlation": float(merged['relative_humidity_2m_previous_day3'].corr(merged['truth_rh']))
            },
            "wind_speed": {
                "mean_error": float(merged['err_wind'].mean()),
                "mae": float(merged['err_wind'].abs().mean()),
                "rmse": float(np.sqrt((merged['err_wind']**2).mean())),
                "correlation": float(merged['wind_speed_10m_previous_day3'].corr(merged['truth_wind']))
            }
        }
    }
    
    with open(REPORT_OUT, 'w') as f:
        json.dump(report, f, indent=4)
        
    print(f"Saved validation report to {REPORT_OUT}")
    print("\nPhase 4 Step 2: Hindcast Acquisition COMPLETE.")

if __name__ == "__main__":
    run_extraction()
