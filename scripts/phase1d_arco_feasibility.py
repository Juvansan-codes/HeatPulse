import os
import sys
import time
import pandas as pd
import numpy as np
import xarray as xr
try:
    import cdsapi
except ImportError:
    print("cdsapi not installed. Run: pip install cdsapi")
    sys.exit(1)

PROCESSED_WEATHER_DIR = r"data\processed\weather"
os.makedirs(PROCESSED_WEATHER_DIR, exist_ok=True)
SAMPLE_CSV_FILE = os.path.join(PROCESSED_WEATHER_DIR, "arco_sample_7days.csv")

# Bounding box for Chennai (North, South, West, East)
# ERA5 latitudes are descending, so slice(North, South)
NORTH, SOUTH = 13.25, 12.80
WEST, EAST = 80.10, 80.35

def compute_rh(t_k, td_k):
    """Compute Relative Humidity using Magnus-Tetens approximation."""
    t = t_k - 273.15
    td = td_k - 273.15
    rh = 100 * (np.exp((17.625 * td) / (243.04 + td)) / np.exp((17.625 * t) / (243.04 + t)))
    return np.clip(rh, 0, 100)

def compute_vapor_pressure(t_c, rh):
    """Compute vapor pressure in hPa."""
    return (rh / 100.0) * 6.105 * np.exp(17.27 * t_c / (237.7 + t_c))

def compute_wbgt_shaded(t_c, e):
    """
    Simplified empirical WBGT (shaded/indoor) based on Australian Bureau of Meteorology.
    WBGT = 0.567 * Ta + 0.393 * e + 3.94
    Ta: air temp in Celsius
    e: vapor pressure in hPa
    """
    return 0.567 * t_c + 0.393 * e + 3.94

def run():
    print("Starting Phase 1D: ERA5-Land ARCO Feasibility Test")
    
    try:
        client = cdsapi.Client()
        token = client.key
    except Exception as e:
        print(f"Failed to init cdsapi client. Ensure ~/.cdsapirc is configured. {e}")
        sys.exit(1)
        
    print("Connecting to official ECMWF ARCO Zarr endpoints...")
    
    # Official ECMWF ARCO Datacubes for ERA5-Land (GeoChunked for spatial queries)
    arco_endpoints = {
        "temperature": "https://arco.datastores.ecmwf.int/cadl-arco-geo-007/arco/reanalysis_era5_land/sfc-2m-temperature/geoChunked.zarr",
        "wind": "https://arco.datastores.ecmwf.int/cadl-arco-geo-008/arco/reanalysis_era5_land/sfc-wind/geoChunked.zarr",
        "pressure": "https://arco.datastores.ecmwf.int/cadl-arco-geo-009/arco/reanalysis_era5_land/sfc-pressure-precipitation/geoChunked.zarr",
        "radiation": "https://arco.datastores.ecmwf.int/cadl-arco-geo-010/arco/reanalysis_era5_land/sfc-radiation-heat/geoChunked.zarr"
    }
    
    storage_options = {
        "headers": {
            "Authorization": f"Bearer {token}"
        }
    }
    
    datasets = []
    
    t0 = time.time()
    try:
        for name, url in arco_endpoints.items():
            print(f"Opening {name} store...")
            ds = xr.open_zarr(url, consolidated=True, storage_options=storage_options)
            datasets.append(ds)
            
        ds_merged = xr.merge(datasets)
    except Exception as e:
        print(f"Failed to open ARCO stores: {e}")
        sys.exit(1)
        
    t1 = time.time()
    print(f"Successfully opened and merged Zarr metadata in {t1 - t0:.2f} seconds.")
    
    print(f"Extracting Chennai bounding box (Lat: {SOUTH} to {NORTH}, Lon: {WEST} to {EAST}) for 2023-05-01 to 2023-05-07...")
    
    # NOTE: Time slicing for ECMWF data often uses 'time' or 'valid_time' depending on the dataset version.
    # ARCO uses 'time' natively.
    time_coord = 'time' if 'time' in ds_merged.coords else 'valid_time'
    
    kwargs = {
        time_coord: slice("2023-05-01", "2023-05-07"),
        'latitude': slice(SOUTH, NORTH),
        'longitude': slice(WEST, EAST)
    }
    
    ds_subset = ds_merged.sel(**kwargs)
    
    # Required variables: t2m, d2m, u10, v10, sp, ssrd
    required_vars = ['t2m', 'd2m', 'u10', 'v10', 'sp', 'ssrd']
    ds_subset = ds_subset[required_vars]
    
    # Load into memory
    print("Loading data into memory...")
    t2 = time.time()
    ds_subset.load()
    t3 = time.time()
    print(f"Data extraction and download complete in {t3 - t2:.2f} seconds.")
    
    df = ds_subset.to_dataframe().reset_index()
    
    # Processing Thermal Engine basic variables
    print("Processing thermal stress metrics...")
    df['t2m_c'] = df['t2m'] - 273.15
    df['d2m_c'] = df['d2m'] - 273.15
    df['rh'] = compute_rh(df['t2m'], df['d2m'])
    df['wind_speed_10m'] = np.sqrt(df['u10']**2 + df['v10']**2)
    df['vapor_pressure_hpa'] = compute_vapor_pressure(df['t2m_c'], df['rh'])
    df['wbgt_shaded'] = compute_wbgt_shaded(df['t2m_c'], df['vapor_pressure_hpa'])
    
    # Inspect SSRD attributes
    ssrd_attrs = ds_subset['ssrd'].attrs
    print("\n--- SSRD Attributes ---")
    for k, v in ssrd_attrs.items():
        print(f"{k}: {v}")
    
    # Save to CSV
    df.to_csv(SAMPLE_CSV_FILE, index=False)
    print(f"\nSaved ARCO sample to {SAMPLE_CSV_FILE}")
    print(f"Dataframe shape: {df.shape}")
    print("Sample Preview:")
    print(df[['latitude', 'longitude', time_coord, 't2m_c', 'rh', 'wbgt_shaded']].head())

if __name__ == "__main__":
    run()
