import os
import glob
import pandas as pd
import xarray as xr
import sys

# Add backend to path for thermal engine
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app.thermal.common import calculate_relative_humidity, calculate_wind_speed
from backend.app.thermal.heat_index import calculate_heat_index
from backend.app.thermal.wbgt import calculate_wbgt_approx
from backend.app.thermal.utci import calculate_utci_approx

RAW_DIR = r"data\raw\weather\era5_land"
OUT_DIR = r"data\processed\weather"

def process_historical():
    nc_files = glob.glob(os.path.join(RAW_DIR, "chennai_era5_*.nc"))
    if not nc_files:
        print("No historical files found.")
        return
        
    dfs = []
    total_grid_cells = 0
    total_obs = 0
    
    for nc in nc_files:
        print(f"Processing {nc}...")
        ds = xr.open_dataset(nc)
        df = ds.to_dataframe().reset_index()
        
        # Determine time column
        time_col = 'valid_time' if 'valid_time' in df.columns else 'time'
        
        # Calculate derived metrics
        df['relative_humidity'] = calculate_relative_humidity(df['t2m'] - 273.15, df['d2m'] - 273.15)
        df['wind_speed_10m'] = calculate_wind_speed(df['u10'], df['v10'])
        
        # Convert temps
        df['temperature_2m'] = df['t2m'] - 273.15
        df['dew_point_2m'] = df['d2m'] - 273.15
        
        # Rename base metrics
        df = df.rename(columns={
            time_col: 'timestamp',
            'latitude': 'latitude',
            'longitude': 'longitude',
            'u10': 'wind_u_10m',
            'v10': 'wind_v_10m',
            'ssrd': 'solar_radiation',
            'sp': 'surface_pressure'
        })
        
        # Add metadata
        df['location_id'] = 'era5_grid_' + df['latitude'].astype(str) + '_' + df['longitude'].astype(str)
        df['source'] = 'era5-land'
        df['is_imputed'] = False
        
        # Thermal Engine
        df['heat_index'] = calculate_heat_index(df['temperature_2m'], df['relative_humidity'])
        df['wbgt'] = calculate_wbgt_approx(df['temperature_2m'], df['relative_humidity'])
        df['utci'] = calculate_utci_approx(df['temperature_2m'], df['relative_humidity'], df['wind_speed_10m'])
        
        canonical_columns = [
            'timestamp', 'location_id', 'latitude', 'longitude',
            'temperature_2m', 'dew_point_2m', 'relative_humidity',
            'wind_u_10m', 'wind_v_10m', 'wind_speed_10m',
            'solar_radiation', 'surface_pressure', 'source', 'is_imputed',
            'heat_index', 'wbgt', 'utci'
        ]
        
        df = df[canonical_columns]
        dfs.append(df)
        
    final_df = pd.concat(dfs, ignore_index=True)
    
    out_path = os.path.join(OUT_DIR, "chennai_historical_unified.parquet")
    final_df.to_parquet(out_path, index=False)
    print(f"Saved Unified Dataset: {out_path}")
    print(f"Total Rows: {len(final_df)}")
    print(f"Unique Grid Cells: {final_df['location_id'].nunique()}")
    print(f"Unique Timestamps: {final_df['timestamp'].nunique()}")
    
if __name__ == "__main__":
    process_historical()
