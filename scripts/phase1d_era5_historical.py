import os
import sys
import time
import zipfile
import glob
import logging
import xarray as xr
try:
    import cdsapi
except ImportError:
    print("cdsapi not installed.")
    sys.exit(1)

# Setup Logging
LOG_DIR = r"data\validation\weather"
os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(LOG_DIR, 'era5_acquisition.log'),
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
console = logging.StreamHandler()
console.setLevel(logging.INFO)
logging.getLogger().addHandler(console)

RAW_WEATHER_DIR = r"data\raw\weather\era5_land"
os.makedirs(RAW_WEATHER_DIR, exist_ok=True)

BOUNDING_BOX = [13.25, 80.10, 12.80, 80.35]
YEARS = [str(y) for y in range(2014, 2024)]
MONTHS = [f"{m:02d}" for m in range(1, 13)]
DAYS = [f"{d:02d}" for d in range(1, 32)]
TIMES = [f"{h:02d}:00" for h in range(24)]

def extract_and_rename(zip_path, target_nc_name):
    """Extracts the .nc from the zip and renames it. Returns True if successful."""
    try:
        if not zipfile.is_zipfile(zip_path):
            logging.error(f"Downloaded file {zip_path} is not a valid zip archive.")
            return False
            
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(RAW_WEATHER_DIR)
            
        # CDS usually creates 'data_0.nc' or similar
        # Find the newest .nc file in the dir (heuristic)
        nc_files = glob.glob(os.path.join(RAW_WEATHER_DIR, "*.nc"))
        nc_files = [f for f in nc_files if not f.endswith(target_nc_name)]
        if not nc_files:
            logging.error("No extracted .nc files found.")
            return False
            
        latest_file = max(nc_files, key=os.path.getctime)
        os.rename(latest_file, os.path.join(RAW_WEATHER_DIR, target_nc_name))
        
        # Remove the zip to save space
        os.remove(zip_path)
        return True
    except Exception as e:
        logging.error(f"Error extracting {zip_path}: {e}")
        return False

def validate_netcdf(nc_path):
    try:
        ds = xr.open_dataset(nc_path)
        ds.close()
        return True
    except Exception as e:
        logging.error(f"Corrupt NetCDF {nc_path}: {e}")
        return False

def run():
    logging.info("Starting Phase 1D: Full Historical ERA5-Land Acquisition (2014-2023)")
    
    try:
        client = cdsapi.Client()
    except Exception as e:
        logging.error(f"CDS API Client init failed: {e}")
        sys.exit(1)
        
    dataset = 'reanalysis-era5-land'
    variables = [
        '2m_temperature', '2m_dewpoint_temperature',
        '10m_u_component_of_wind', '10m_v_component_of_wind',
        'surface_solar_radiation_downwards', 'surface_pressure'
    ]

    import csv
    
    MANIFEST_FILE = os.path.join(RAW_WEATHER_DIR, "manifest.csv")
    
    # Initialize manifest if it doesn't exist
    if not os.path.exists(MANIFEST_FILE):
        with open(MANIFEST_FILE, mode='w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['year', 'month', 'filename', 'status', 'timestamp_count', 'grid_cell_count', 'file_size_bytes', 'validation_status'])
            
    def append_manifest(year, month, filename, status, ts_count, grid_count, size, val_status):
        with open(MANIFEST_FILE, mode='a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([year, month, filename, status, ts_count, grid_count, size, val_status])

    for year in YEARS:
        for month in MONTHS:
            target_nc = f"chennai_era5_{year}_{month}.nc"
            target_nc_path = os.path.join(RAW_WEATHER_DIR, target_nc)
            temp_zip_path = os.path.join(RAW_WEATHER_DIR, f"temp_{year}_{month}.zip")
            
            # Check manifest to skip
            already_success = False
            if os.path.exists(MANIFEST_FILE):
                with open(MANIFEST_FILE, mode='r', newline='') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        if row['year'] == year and row['month'] == month and row['status'] == 'SUCCESS':
                            already_success = True
                            break
            
            if already_success and os.path.exists(target_nc_path):
                logging.info(f"File {target_nc} already successfully in manifest. Skipping.")
                continue
                
            if os.path.exists(target_nc_path):
                if validate_netcdf(target_nc_path):
                    logging.info(f"File {target_nc} exists and is valid. Re-logging to manifest.")
                    try:
                        ds = xr.open_dataset(target_nc_path)
                        ts_c = len(ds.coords.get('valid_time', ds.coords.get('time', [])))
                        g_c = ds.dims.get('latitude', 0) * ds.dims.get('longitude', 0) or ds.dims.get('value', 0)
                        ds.close()
                    except:
                        ts_c, g_c = 0, 0
                    append_manifest(year, month, target_nc, 'SUCCESS', ts_c, g_c, os.path.getsize(target_nc_path), 'VALID')
                    continue
                else:
                    logging.warning(f"File {target_nc} exists but is corrupt. Re-downloading.")
                    os.remove(target_nc_path)
            
            request = {
                'variable': variables,
                'year': year,
                'month': [month],
                'day': DAYS,
                'time': TIMES,
                'area': BOUNDING_BOX,
                'format': 'netcdf'
            }
            
            retries = 3
            success = False
            
            for attempt in range(retries):
                logging.info(f"Requesting {year}-{month}, attempt {attempt+1}/{retries}...")
                try:
                    client.retrieve(dataset, request, temp_zip_path)
                    
                    if zipfile.is_zipfile(temp_zip_path):
                        logging.info(f"Downloaded ZIP for {year}-{month}. Extracting...")
                        if extract_and_rename(temp_zip_path, target_nc):
                            if validate_netcdf(target_nc_path):
                                logging.info(f"Successfully processed {year}-{month}")
                                success = True
                                break
                            else:
                                logging.error(f"Extracted file for {year}-{month} is corrupt.")
                    else:
                        os.rename(temp_zip_path, target_nc_path)
                        if validate_netcdf(target_nc_path):
                            logging.info(f"Successfully downloaded direct NetCDF for {year}-{month}")
                            success = True
                            break
                        else:
                            logging.error(f"Downloaded direct file for {year}-{month} is corrupt.")
                            
                except Exception as e:
                    logging.error(f"Download failed for {year}-{month}: {e}")
                    
                time.sleep(10)
                
            if success:
                try:
                    ds = xr.open_dataset(target_nc_path)
                    ts_c = len(ds.coords.get('valid_time', ds.coords.get('time', [])))
                    g_c = ds.dims.get('latitude', 0) * ds.dims.get('longitude', 0) or ds.dims.get('value', 0)
                    ds.close()
                except:
                    ts_c, g_c = 0, 0
                append_manifest(year, month, target_nc, 'SUCCESS', ts_c, g_c, os.path.getsize(target_nc_path), 'VALID')
            else:
                append_manifest(year, month, target_nc, 'FAILED', 0, 0, 0, 'INVALID')
                logging.critical(f"Failed to acquire data for {year}-{month} after {retries} attempts.")
                sys.exit(1)

    logging.info("All historical data acquired successfully.")

if __name__ == "__main__":
    run()
