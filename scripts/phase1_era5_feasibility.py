import os
import sys
import json
import pandas as pd
import numpy as np
import xarray as xr
try:
    import cdsapi
except ImportError:
    cdsapi = None

RAW_WEATHER_DIR = r"data\raw\weather\era5_land"
PROCESSED_WEATHER_DIR = r"data\processed\weather"
VALIDATION_FILE = r"data\validation\weather\era5_feasibility_report.txt"

SAMPLE_NC_FILE = os.path.join(RAW_WEATHER_DIR, "chennai_sample_7days.nc")
SAMPLE_PARQUET_FILE = os.path.join(PROCESSED_WEATHER_DIR, "chennai_sample_canonical.parquet")

# Chennai Bounding Box (from Phase 1A)
# minx, miny, maxx, maxy = 80.140, 12.851, 80.331, 13.235
# ERA5 bounding box format: [North, West, South, East]
BOUNDING_BOX = [13.25, 80.10, 12.80, 80.35]

def compute_rh(t2m, d2m):
    # Magnus-Tetens approximation for Relative Humidity
    # temperatures in Kelvin, need to convert to Celsius
    t = t2m - 273.15
    td = d2m - 273.15
    rh = 100 * (np.exp((17.625 * td) / (243.04 + td)) / np.exp((17.625 * t) / (243.04 + t)))
    return rh

def compute_wind_speed(u, v):
    return np.sqrt(u**2 + v**2)

def run():
    print("Starting Phase 1C: ERA5-Land Feasibility Test")
    
    if not cdsapi:
        print("cdsapi not installed.")
        sys.exit(1)
        
    client = cdsapi.Client()
    
    # Check if credentials are set (cdsapi checks ~/.cdsapirc or CDSAPI_URL/CDSAPI_KEY env vars)
    if not client.url or not client.key:
        msg = "ERROR: CDS API credentials not found. Please create ~/.cdsapirc or set CDSAPI_URL and CDSAPI_KEY."
        print(msg)
        with open(VALIDATION_FILE, 'w') as f:
            f.write(msg + "\n")
        sys.exit(1)
        
    print("Requesting 7-day ERA5-Land sample for Chennai...")
    
    # Request definition
    dataset = 'reanalysis-era5-land'
    request = {
        'variable': [
            '2m_temperature', '2m_dewpoint_temperature',
            '10m_u_component_of_wind', '10m_v_component_of_wind',
            'surface_solar_radiation_downwards', 'surface_pressure'
        ],
        'year': '2023',
        'month': '05', # May (hot month)
        'day': ['01', '02', '03', '04', '05', '06', '07'],
        'time': [f"{i:02d}:00" for i in range(24)],
        'area': BOUNDING_BOX,
        'format': 'netcdf'
    }

    try:
        if not os.path.exists(SAMPLE_NC_FILE):
            client.retrieve(dataset, request, SAMPLE_NC_FILE)
            print(f"Downloaded NetCDF sample to {SAMPLE_NC_FILE}")
        else:
            print(f"Sample file {SAMPLE_NC_FILE} already exists. Skipping download.")
    except Exception as e:
        msg = f"Failed to download ERA5-Land data: {e}"
        print(msg)
        with open(VALIDATION_FILE, 'w') as f:
            f.write(msg + "\n")
        sys.exit(1)
        
    print("Processing NetCDF file...")
    import zipfile
    import glob
    
    # The new CDS API sometimes returns a zip file instead of raw NetCDF.
    if zipfile.is_zipfile(SAMPLE_NC_FILE):
        print("Downloaded file is a ZIP archive. Extracting...")
        with zipfile.ZipFile(SAMPLE_NC_FILE, 'r') as zip_ref:
            zip_ref.extractall(RAW_WEATHER_DIR)
        # Find the extracted .nc file
        nc_files = glob.glob(os.path.join(RAW_WEATHER_DIR, "*.nc"))
        nc_files = [f for f in nc_files if f != SAMPLE_NC_FILE] # exclude the zip if it has .nc extension
        if nc_files:
            target_nc_file = nc_files[0]
            print(f"Extracted NetCDF file: {target_nc_file}")
            ds = xr.open_dataset(target_nc_file)
        else:
            print("No NetCDF file found inside the zip archive.")
            sys.exit(1)
    else:
        ds = xr.open_dataset(SAMPLE_NC_FILE)
    
    # Extract DataFrames
    df = ds.to_dataframe().reset_index()
    
    # 7. Derive relative humidity and wind speed
    df['relative_humidity'] = compute_rh(df['t2m'], df['d2m'])
    df['wind_speed_10m'] = compute_wind_speed(df['u10'], df['v10'])
    
    # Convert temperatures to Celsius
    df['temperature_2m'] = df['t2m'] - 273.15
    df['dew_point_2m'] = df['d2m'] - 273.15
    
    # Rename variables to match canonical schema
    rename_dict = {
        'latitude': 'latitude',
        'longitude': 'longitude',
        'u10': 'wind_u_10m',
        'v10': 'wind_v_10m',
        'ssrd': 'solar_radiation',
        'sp': 'surface_pressure'
    }
    if 'time' in df.columns:
        rename_dict['time'] = 'timestamp'
    if 'valid_time' in df.columns:
        rename_dict['valid_time'] = 'timestamp'
        
    df = df.rename(columns=rename_dict)
    
    # Add metadata
    df['location_id'] = 'era5_grid_' + df['latitude'].astype(str) + '_' + df['longitude'].astype(str)
    df['source'] = 'era5-land'
    df['is_imputed'] = False
    
    # Reorder columns
    canonical_columns = [
        'timestamp', 'location_id', 'latitude', 'longitude',
        'temperature_2m', 'dew_point_2m', 'relative_humidity',
        'wind_u_10m', 'wind_v_10m', 'wind_speed_10m',
        'solar_radiation', 'surface_pressure', 'source', 'is_imputed'
    ]
    
    # Filter only if they exist in df (NetCDF var names might vary slightly, but we defined them)
    df = df[canonical_columns]
    
    # 9. Save a small Parquet test file.
    df.to_parquet(SAMPLE_PARQUET_FILE, index=False)
    print(f"Saved Canonical schema dataset to {SAMPLE_PARQUET_FILE}")
    print(f"Parquet shape: {df.shape}")
    
    # 10. Document the successful pipeline
    with open(VALIDATION_FILE, 'w') as f:
        f.write("ERA5-Land Feasibility Report\n")
        f.write("============================\n\n")
        f.write("Status: SUCCESS\n")
        f.write(f"Sample File: {SAMPLE_NC_FILE}\n")
        f.write(f"Parquet File: {SAMPLE_PARQUET_FILE}\n")
        f.write(f"Rows: {len(df)}\n")
        f.write(f"Columns: {df.columns.tolist()}\n")
        f.write("\nData validation summary:\n")
        f.write(str(df.describe()))
        
    print(f"Validation report saved to {VALIDATION_FILE}")

if __name__ == "__main__":
    run()
