import os
import sys
import time
import json
import psutil
import pandas as pd
import numpy as np
import xarray as xr
from pathlib import Path
try:
    import cdsapi
except ImportError:
    print("cdsapi not installed.")
    sys.exit(1)

# Import thermal computations
sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
from phase2_step2_tmrt import compute_tmrt
from phase2_step3_wbgt import compute_wbgt_outdoor
from phase2_step4_utci import compute_utci
from phase2_step6_htsi import compute_htsi

PROCESSED_WEATHER_DIR = Path("data/processed/weather")
os.makedirs(PROCESSED_WEATHER_DIR, exist_ok=True)
PARQUET_OUT = PROCESSED_WEATHER_DIR / "forecast_truth_2024_2025.parquet"
METADATA_OUT = PROCESSED_WEATHER_DIR / "forecast_truth_2024_2025_metadata.json"

NORTH, SOUTH = 13.25, 12.80
WEST, EAST = 80.10, 80.35

def get_memory_usage():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / 1024**2

def compute_rh(t_k, td_k):
    t = t_k - 273.15
    td = td_k - 273.15
    rh = 100 * (np.exp((17.625 * td) / (243.04 + td)) / np.exp((17.625 * t) / (243.04 + t)))
    return np.clip(rh, 0, 100)

def extract_arco(start_date="2024-01-01", end_date="2025-12-31"):
    print(f"Starting Phase 4 Step 1: Forecast Truth Extraction ({start_date} to {end_date})")
    
    try:
        client = cdsapi.Client()
        token = client.key
    except Exception as e:
        print(f"CDS API init failed: {e}")
        sys.exit(1)
        
    arco_endpoints = {
        "temperature": "https://arco.datastores.ecmwf.int/cadl-arco-geo-007/arco/reanalysis_era5_land/sfc-2m-temperature/geoChunked.zarr",
        "wind": "https://arco.datastores.ecmwf.int/cadl-arco-geo-008/arco/reanalysis_era5_land/sfc-wind/geoChunked.zarr",
        "pressure": "https://arco.datastores.ecmwf.int/cadl-arco-geo-009/arco/reanalysis_era5_land/sfc-pressure-precipitation/geoChunked.zarr",
        "radiation": "https://arco.datastores.ecmwf.int/cadl-arco-geo-010/arco/reanalysis_era5_land/sfc-radiation-heat/geoChunked.zarr"
    }
    
    storage_options = {"headers": {"Authorization": f"Bearer {token}"}}
    datasets = []
    print("\n[1] CONNECTING TO ARCO STORES (Lazy Chunked Loading)...")
    for name, url in arco_endpoints.items():
        print(f" - Opening {name} store...")
        ds = xr.open_zarr(url, consolidated=True, storage_options=storage_options, chunks="auto")
        datasets.append(ds)
        
    ds_merged = xr.merge(datasets)
    time_coord = 'time' if 'time' in ds_merged.coords else 'valid_time'
    
    print(f"\n[2] SLICING DATASET ({start_date} to {end_date})...")
    kwargs = {
        time_coord: slice(start_date, end_date),
        'latitude': slice(SOUTH, NORTH),
        'longitude': slice(WEST, EAST)
    }
    
    ds_subset = ds_merged.sel(**kwargs)
    required_vars = ['t2m', 'd2m', 'u10', 'v10', 'sp', 'ssrd']
    ds_subset = ds_subset[required_vars]
    
    lats = ds_subset.latitude.values
    lons = ds_subset.longitude.values
    actual_grid_cells = len(lats) * len(lons)
    print(f"\nGrid Cells Extracted: {actual_grid_cells}")
    
    print("\n[3] EXTRACTING (Loading into memory)...")
    ds_subset = ds_subset.compute()
    
    df = ds_subset.to_dataframe().reset_index()
    df['t2m_c'] = df['t2m'] - 273.15
    df['d2m_c'] = df['d2m'] - 273.15
    df['relative_humidity'] = compute_rh(df['t2m'], df['d2m'])
    df['wind_speed_10m'] = np.sqrt(df['u10']**2 + df['v10']**2)
    df['solar_radiation'] = df['ssrd'] / 3600.0
    
    df['source'] = 'era5-land'
    df['is_imputed'] = False
    
    rename_dict = {
        't2m_c': 'temperature_2m',
        'd2m_c': 'dew_point_2m',
        'u10': 'wind_u_10m',
        'v10': 'wind_v_10m',
        'sp': 'surface_pressure',
        time_coord: 'timestamp'
    }
    df = df.rename(columns=rename_dict)
    
    canonical_columns = [
        'timestamp', 'latitude', 'longitude',
        'temperature_2m', 'dew_point_2m', 'relative_humidity',
        'wind_u_10m', 'wind_v_10m', 'wind_speed_10m',
        'solar_radiation', 'surface_pressure', 'source', 'is_imputed'
    ]
    df = df[canonical_columns]
    df_land = df.dropna(subset=['temperature_2m']).copy()
    
    # Sort and clean
    df_land['timestamp'] = pd.to_datetime(df_land['timestamp'], utc=True)
    df_land = df_land.sort_values(["latitude", "longitude", "timestamp"]).reset_index(drop=True)
    
    print(f"Extracted {len(df_land)} observations for 2024-2025.")
    return df_land

def process_thermal_indices(df_2024):
    print("\n[4] COMPUTING THERMAL INDICES (Tmrt, WBGT, UTCI)...")
    df = df_2024.copy()
    df['grid_id'] = df["latitude"].map("{:.6f}".format) + "," + df["longitude"].map("{:.6f}".format)
    
    print(" - Computing Tmrt...")
    df = compute_tmrt(df)
    
    print(" - Computing WBGT Outdoor...")
    df = compute_wbgt_outdoor(df)
    
    print(" - Computing UTCI...")
    df = compute_utci(df)
    
    return df

def run():
    df_2024 = extract_arco("2024-01-01", "2025-12-31")
    df_2024_thermal = process_thermal_indices(df_2024)
    
    print("\n[5] COMPUTING HTSI (Requires historical baseline)...")
    hist_path = PROCESSED_WEATHER_DIR / "thermal_step4_utci_2014_2023.parquet"
    if not hist_path.exists():
        print(f"Cannot compute HTSI: Missing {hist_path}")
        sys.exit(1)
        
    df_hist = pd.read_parquet(hist_path)
    df_hist['timestamp'] = pd.to_datetime(df_hist['timestamp'], utc=True)
    
    print(f"Loaded historical dataset: {len(df_hist)} rows.")
    
    combined = pd.concat([df_hist, df_2024_thermal], ignore_index=True)
    combined = combined.sort_values(["latitude", "longitude", "timestamp"]).reset_index(drop=True)
    
    print(" - Running compute_htsi on combined dataset...")
    df_htsi, boundaries = compute_htsi(combined)
    
    # Merge HTSI columns back to 2024 dataset
    print("\n[6] FINALIZING TRUTH DATASET...")
    
    htsi_cols = [
        "timestamp", "grid_id", "latitude", "longitude", "utci_score", "wbgt_percentile",
        "wbgt_score", "heat_index", "burden_24h", "burden_72h", "is_night_ist",
        "nighttime_temp_percentile", "nighttime_stress", "thermal_hazard_score",
        "htsi", "htsi_level", "htsi_label", "extreme_thermal_event", "data_quality"
    ]
    df_htsi_subset = df_htsi[htsi_cols]
    
    # Filter HTSI output to just 2024
    df_2024_final = pd.merge(
        df_2024_thermal, 
        df_htsi_subset, 
        on=["timestamp", "latitude", "longitude", "grid_id"], 
        how="inner"
    )
    
    # Validation checks
    assert len(df_2024_final) == len(df_2024_thermal), "Row count mismatch after HTSI merge!"
    
    print(f"Final 2024 Truth Dataset Shape: {df_2024_final.shape}")
    
    df_2024_final.to_parquet(PARQUET_OUT, index=False)
    file_size_mb = os.path.getsize(PARQUET_OUT) / 1024**2
    print(f"\nSaved {PARQUET_OUT} (Size: {file_size_mb:.2f} MB)")
    
    meta = {
        "dataset_info": {
            "source": "Copernicus ERA5-Land ARCO Zarr",
            "extraction_timestamp": pd.Timestamp.now(tz='UTC').isoformat(),
            "time_range": {"start": df_2024_final.timestamp.min().isoformat(), "end": df_2024_final.timestamp.max().isoformat()},
        },
        "processing_notes": {
            "indices": ["Tmrt", "WBGT", "UTCI", "HTSI"],
            "htsi_baseline": "Combined 2014-2023 historical data with 2024 prior to HTSI percentile computation."
        }
    }
    with open(METADATA_OUT, 'w') as f:
        json.dump(meta, f, indent=4)
    print(f"Saved {METADATA_OUT}")
    print("\nPhase 4 Step 1: Truth Extraction COMPLETE.")

if __name__ == "__main__":
    run()
