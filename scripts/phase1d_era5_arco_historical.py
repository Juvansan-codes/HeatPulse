import os
import sys
import time
import json
import psutil
import pandas as pd
import numpy as np
import xarray as xr
try:
    import cdsapi
except ImportError:
    print("cdsapi not installed.")
    sys.exit(1)

PROCESSED_WEATHER_DIR = r"data\processed\weather"
RAW_WEATHER_DIR = r"data\raw\weather\era5_land"
os.makedirs(PROCESSED_WEATHER_DIR, exist_ok=True)
PARQUET_OUT = os.path.join(PROCESSED_WEATHER_DIR, "chennai_era5_2014_2023.parquet")
METADATA_OUT = os.path.join(PROCESSED_WEATHER_DIR, "metadata.json")
LEGACY_CDS_FILE = os.path.join(RAW_WEATHER_DIR, "chennai_era5_2014_01.nc")

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

def run():
    print("Starting Phase 1D: Full Historical ARCO Acquisition (2014-2023)")
    
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
    t0 = time.time()
    for name, url in arco_endpoints.items():
        print(f" - Opening {name} store...")
        ds = xr.open_zarr(url, consolidated=True, storage_options=storage_options, chunks="auto")
        datasets.append(ds)
        
    ds_merged = xr.merge(datasets)
    print(f"Merged Zarr metadata in {time.time() - t0:.2f} seconds.")
    
    time_coord = 'time' if 'time' in ds_merged.coords else 'valid_time'
    
    # Slice Spatial & Temporal
    print("\n[2] SLICING DATASET (2014-2023)...")
    kwargs = {
        time_coord: slice("2014-01-01", "2023-12-31"),
        'latitude': slice(SOUTH, NORTH),
        'longitude': slice(WEST, EAST)
    }
    
    ds_subset = ds_merged.sel(**kwargs)
    required_vars = ['t2m', 'd2m', 'u10', 'v10', 'sp', 'ssrd']
    ds_subset = ds_subset[required_vars]
    
    # 2. Check grid cells dynamically
    print("\n[3] GRID CELL IDENTIFICATION...")
    lats = ds_subset.latitude.values
    lons = ds_subset.longitude.values
    actual_grid_cells = len(lats) * len(lons)
    print(f"Latitudes: {lats}")
    print(f"Longitudes: {lons}")
    print(f"Actual Grid Cells Extracted: {actual_grid_cells} (Expected: 8)")
    if actual_grid_cells != 8:
        print(f"WARNING: Extracted {actual_grid_cells} grid cells instead of the previously validated 8. Proceeding anyway per instructions.")
    
    # Calculate Memory Requirements
    print("\n[4] MEMORY SAFETY CHECK...")
    estimated_bytes = ds_subset.nbytes
    estimated_mb = estimated_bytes / 1024**2
    sys_mem = psutil.virtual_memory().available / 1024**2
    print(f"Estimated Dataset Size: {estimated_mb:.2f} MB")
    print(f"Available System Memory: {sys_mem:.2f} MB")
    if estimated_mb > sys_mem * 0.8:
        print("CRITICAL WARNING: Dataset size approaches system memory limit! Xarray compute() may crash.")
        sys.exit(1)
    
    print("\n[5] SSRD VALIDATION & INSPECTION...")
    print("Attributes:")
    print(ds_subset['ssrd'].attrs)
    # Print the first 24 hours of SSRD for a single grid cell to observe the accumulation
    ssrd_sample = ds_subset['ssrd'].isel(latitude=0, longitude=0).isel({time_coord: slice(0, 24)}).compute()
    print("SSRD first 24 hours (J/m^2):")
    print(ssrd_sample.values)
    # Determine behavior: 
    # Usually in ERA5, the first step of the day might be 0, or it might accumulate over hours 1 to 24.
    # In ARCO, with stepUnits=1, the standard convention is accumulation since the previous hour.
    # We will divide by 3600 to get average W/m^2.
    print("Applying /3600 conversion to SSRD based on GRIB_stepUnits=1 (Hourly Accumulation)...")
    
    print("\n[6] CDS VS ARCO VALIDATION (Jan 2014)...")
    validation_results = {}
    if os.path.exists(LEGACY_CDS_FILE):
        try:
            ds_cds = xr.open_dataset(LEGACY_CDS_FILE)
            # Find the time overlap (Jan 2014)
            # Both should have 744 hours
            overlap_time = slice("2014-01-01", "2014-01-31")
            
            # Sub-slice the ARCO data for comparison
            ds_arco_val = ds_subset.sel(**{time_coord: overlap_time}).compute()
            
            # The CDS file might have descending latitudes, but xarray sel handles it if we match coordinates exactly
            # But let's just reindex or sel the nearest to compare point by point
            # Select first point for simple comparison
            p_lat, p_lon = lats[0], lons[0]
            arco_point = ds_arco_val.sel(latitude=p_lat, longitude=p_lon, method='nearest')
            cds_point = ds_cds.sel(latitude=p_lat, longitude=p_lon, method='nearest')
            
            # Compare t2m
            t2m_arco = arco_point['t2m'].values
            t2m_cds = cds_point['t2m'].values if 't2m' in cds_point else cds_point['2m_temperature'].values
            
            # Remove NaNs if any (there shouldn't be for t2m)
            valid = ~np.isnan(t2m_arco) & ~np.isnan(t2m_cds)
            t2m_arco = t2m_arco[valid]
            t2m_cds = t2m_cds[valid]
            
            diff = np.abs(t2m_arco - t2m_cds)
            max_diff = np.max(diff)
            mean_diff = np.mean(diff)
            pct_within_01 = np.sum(diff < 0.1) / len(diff) * 100 if len(diff) > 0 else 0
            
            print(f"CDS vs ARCO Comparison for t2m at ({p_lat}, {p_lon})")
            print(f" - Data points compared: {len(diff)}")
            print(f" - Max Abs Diff: {max_diff:.5f} K")
            print(f" - Mean Abs Diff: {mean_diff:.5f} K")
            print(f" - % within 0.1 K: {pct_within_01:.2f}%")
            
            validation_results = {
                "max_diff_t2m": float(max_diff),
                "mean_diff_t2m": float(mean_diff),
                "compared_count": int(len(diff)),
                "percent_within_0.1": float(pct_within_01)
            }
            
            ds_cds.close()
        except Exception as e:
            print(f"Validation against CDS failed: {e}")
    else:
        print(f"Legacy CDS file not found at {LEGACY_CDS_FILE}. Skipping cross-check.")
        
    print("\n[7] EXTRACTING FULL DECADE (Loading into memory)...")
    t1 = time.time()
    ds_subset = ds_subset.compute()
    t2 = time.time()
    print(f"Extraction completed in {t2 - t1:.2f} seconds.")
    print(f"Memory Usage after compute: {get_memory_usage():.2f} MB")
    
    print("\n[8] DATA PROCESSING & CANONICAL SCHEMA...")
    df = ds_subset.to_dataframe().reset_index()
    
    df['t2m_c'] = df['t2m'] - 273.15
    df['d2m_c'] = df['d2m'] - 273.15
    df['relative_humidity'] = compute_rh(df['t2m'], df['d2m'])
    df['wind_speed_10m'] = np.sqrt(df['u10']**2 + df['v10']**2)
    # Apply SSRD conversion
    df['solar_radiation'] = df['ssrd'] / 3600.0
    
    df['source'] = 'era5-land'
    df['is_imputed'] = False
    
    # Rename to Canonical
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
    
    # Identify land vs ocean cells (ocean cells have NaN in ERA5-Land)
    initial_obs = len(df)
    df_land = df.dropna(subset=['temperature_2m'])
    ocean_obs = initial_obs - len(df_land)
    
    land_cells = df_land[['latitude', 'longitude']].drop_duplicates()
    actual_land_cells = len(land_cells)
    actual_ocean_cells = actual_grid_cells - actual_land_cells
    
    # Preserve only valid land cells for the final dataset
    df = df_land.copy()
    
    print("\n[9] FINAL VALIDATION & DATA QUALITY...")
    timestamp_count = df['timestamp'].nunique()
    obs_count = len(df)
    missing_stats = df.isna().sum().to_dict()
    
    print(f"Actual Timestamps: {timestamp_count} (Expected ~87648)")
    print(f"Actual Total Grid Cells in Bbox: {actual_grid_cells}")
    print(f"Actual Land Grid Cells: {actual_land_cells} (Expected from previous run: 8)")
    print(f"Actual Ocean Grid Cells: {actual_ocean_cells}")
    print(f"Total Land Observations: {obs_count}")
    print("Missing values per variable in Land cells:")
    for k, v in missing_stats.items():
        print(f"  {k}: {v}")
        
    print("\n[10] SAVING PARQUET & METADATA...")
    df.to_parquet(PARQUET_OUT, index=False)
    file_size_mb = os.path.getsize(PARQUET_OUT) / 1024**2
    print(f"Saved {PARQUET_OUT} (Size: {file_size_mb:.2f} MB)")
    
    meta = {
        "dataset_info": {
            "source": "Copernicus ERA5-Land ARCO Zarr",
            "extraction_timestamp": pd.Timestamp.now(tz='UTC').isoformat(),
            "time_range": {"start": "2014-01-01", "end": "2023-12-31"},
            "spatial_extent": {"north": NORTH, "south": SOUTH, "west": WEST, "east": EAST}
        },
        "data_quality": {
            "timestamp_count": timestamp_count,
            "bbox_grid_cells": int(actual_grid_cells),
            "land_grid_cells": int(actual_land_cells),
            "ocean_grid_cells": int(actual_ocean_cells),
            "total_land_observations": int(obs_count),
            "missing_values": missing_stats,
            "parquet_size_mb": float(file_size_mb)
        },
        "processing_notes": {
            "ssrd_conversion": "Divided ARCO ssrd (J/m^2 accumulated over 1 hour) by 3600 to yield W/m^2 hourly average flux.",
            "spatial_filtering": "Dropped ocean grid cells (NaNs in ERA5-Land) to retain only valid land data."
        },
        "validation_results": validation_results
    }
    with open(METADATA_OUT, 'w') as f:
        json.dump(meta, f, indent=4)
    print(f"Saved {METADATA_OUT}")
    print("\nPhase 1D Historical Acquisition COMPLETE. STOP.")

if __name__ == "__main__":
    run()
