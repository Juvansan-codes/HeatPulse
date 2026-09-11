"""
Phase 4.5.2: Production Database Ingestion Script (REST API Version)
This script populates the Supabase PostgreSQL database using the HTTPS REST API 
to bypass strict local network firewalls that block standard database ports (5432/6543).
"""
import os
import sys
import math
import pandas as pd
import geopandas as gpd
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and/or SUPABASE_KEY environment variables are not set.")
    sys.exit(1)

# File Paths
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
GEOJSON_PATH = os.path.join(DATA_DIR, "processed", "gis", "chennai_wards_processed.geojson")
EXPOSURE_PATH = os.path.join(DATA_DIR, "processed", "gis", "ward_exposure_200.csv")
VULNERABILITY_PATH = os.path.join(DATA_DIR, "processed", "risk", "ward_vulnerability_200.csv")
FORECAST_GRIDS_PATH = os.path.join(DATA_DIR, "processed", "weather", "forecast_operational_2024_2025.parquet")
FORECAST_RISK_PATH = os.path.join(DATA_DIR, "processed", "risk", "forecast_ward_heat_risk_2024_2025.parquet")
FORECAST_ALERTS_PATH = os.path.join(DATA_DIR, "processed", "risk", "forecast_alerts_2024_2025.parquet")

def clean_dict(d):
    """Replace NaN and Infinity with None for JSON serialization."""
    for k, v in d.items():
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            d[k] = None
        elif isinstance(v, pd.Timestamp):
            d[k] = v.isoformat()
    return d

def ingest_wards(supabase: Client):
    print("Ingesting static wards geometry via REST API...")
    gdf = gpd.read_file(GEOJSON_PATH)
    gdf = gdf[(gdf["Ward_No"] > 0) & (gdf["Ward_No"] <= 200)].copy()
    
    exp_df = pd.read_csv(EXPOSURE_PATH)[["ward_id", "area_km2"]]
    gdf = gdf.merge(exp_df, left_on="Ward_No", right_on="ward_id", how="left")
    
    records = []
    for _, row in gdf.iterrows():
        # PostgREST natively parses standard WKT string to PostGIS geometry
        wkt = row["geometry"].wkt
        geom_str = f"SRID=4326;{wkt}"
        
        record = {
            "ward_id": int(row["Ward_No"]),
            "ward_name": str(row["Zone_Name"]),
            "zone_id": str(row["Zone_No"]),
            "city": "Chennai",
            "area_km2": float(row["area_km2"]) if not pd.isna(row["area_km2"]) else None,
            "geom": geom_str
        }
        records.append(record)
    
    # Chunk into 50 items per request to avoid payload size limits
    chunk_size = 50
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i+chunk_size]
        supabase.table("wards").upsert(chunk).execute()
        
    print(f"Successfully ingested {len(records)} wards.")

def ingest_static_data(supabase: Client):
    print("Ingesting ward_exposure and ward_vulnerability...")
    
    # Exposure
    exp_df = pd.read_csv(EXPOSURE_PATH)
    exp_records = [clean_dict(row) for row in exp_df[[
        "ward_id", "population", "population_density", "population_source",
        "population_method", "population_vintage", "population_is_derived", "population_confidence"
    ]].to_dict(orient="records")]
    
    supabase.table("ward_exposure").upsert(exp_records).execute()
    
    # Vulnerability
    vul_df = pd.read_csv(VULNERABILITY_PATH)
    vul_records = [clean_dict(row) for row in vul_df[[
        "ward_id", "healthcare_facility_count", "healthcare_facilities_per_10000_derived_population",
        "population_density_sensitivity", "healthcare_access_capacity", "vulnerability",
        "healthcare_confidence", "vulnerability_model", "vulnerability_confidence", "omitted_variables"
    ]].to_dict(orient="records")]
    
    supabase.table("ward_vulnerability").upsert(vul_records).execute()
    print(f"Successfully ingested static application data.")

def ingest_operational_window(supabase: Client):
    print("Ingesting operational forecast window...")
    
    df_risk_meta = pd.read_parquet(FORECAST_RISK_PATH, columns=["initialization_time"])
    latest_init = df_risk_meta["initialization_time"].max()
    print(f"Latest operational initialization identified as: {latest_init}")
    del df_risk_meta
    
    # Since we can't do DELETE without a WHERE clause in PostgREST, we just upsert or delete based on old runs
    # For a true purge of old data via REST, we would query the current data and delete.
    # To keep this fast, we will rely on the app filtering by latest init_time, 
    # but we can try to delete records where initialization_time != latest_init
    try:
        supabase.table("forecast_grids").delete().neq("initialization_time", latest_init.isoformat()).execute()
        supabase.table("ward_forecast_risk").delete().neq("initialization_time", latest_init.isoformat()).execute()
        supabase.table("ward_alerts").delete().neq("initialization_time", latest_init.isoformat()).execute()
    except Exception as e:
        print(f"Cleanup note: {e}")

    # 1. Forecast Grids
    df_grids = pd.read_parquet(FORECAST_GRIDS_PATH)
    df_grids = df_grids[df_grids["initialization_time"] == latest_init].copy()
    
    grid_cols = [
        "grid_id", "initialization_time", "valid_time", "latitude", "longitude",
        "lead_day", "lead_hours", "temperature_2m", "relative_humidity", "wind_speed_10m",
        "solar_radiation", "mean_radiant_temp", "wbgt_outdoor", "utci", "heat_index",
        "thermal_hazard_score", "burden_24h", "burden_72h", "htsi", "htsi_level", "htsi_label"
    ]
    grid_records = [clean_dict(row) for row in df_grids[grid_cols].to_dict(orient="records")]
    
    chunk_size = 500
    for i in range(0, len(grid_records), chunk_size):
        supabase.table("forecast_grids").upsert(grid_records[i:i+chunk_size]).execute()
    print(f"Inserted {len(grid_records)} forecast_grids rows.")
    del df_grids
    
    # 2. Ward Risk
    df_risk = pd.read_parquet(FORECAST_RISK_PATH)
    df_risk = df_risk[df_risk["initialization_time"] == latest_init].copy()
    
    risk_cols = [
        "initialization_time", "valid_time", "ward_id", "assigned_grid_id",
        "htsi_level", "heat_hazard", "human_heat_risk", "extreme_utci_flag"
    ]
    risk_records = [clean_dict(row) for row in df_risk[risk_cols].to_dict(orient="records")]
    
    for i in range(0, len(risk_records), chunk_size):
        supabase.table("ward_forecast_risk").upsert(risk_records[i:i+chunk_size]).execute()
    print(f"Inserted {len(risk_records)} ward_forecast_risk rows.")
    del df_risk
    
    # 3. Ward Alerts
    df_alerts = pd.read_parquet(FORECAST_ALERTS_PATH)
    df_alerts = df_alerts[df_alerts["initialization_time"] == latest_init].copy()
    
    if len(df_alerts) > 0:
        alert_cols = [
            "initialization_time", "ward_id", "start_time", "end_time", "peak_time",
            "maximum_alert_level", "peak_htsi", "peak_utci", "peak_risk", "extreme_utci_flag"
        ]
        alert_records = [clean_dict(row) for row in df_alerts[alert_cols].to_dict(orient="records")]
        
        for i in range(0, len(alert_records), chunk_size):
            supabase.table("ward_alerts").upsert(alert_records[i:i+chunk_size]).execute()
        print(f"Inserted {len(alert_records)} ward_alerts rows.")
    else:
        print("No active alerts in the current operational window.")

def main():
    try:
        print("Connecting to Supabase via REST API (Port 443)...")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        ingest_wards(supabase)
        ingest_static_data(supabase)
        ingest_operational_window(supabase)
        
        print("\nSUCCESS: Production Data Ingestion Complete via REST!")
    except Exception as e:
        print(f"\nERROR: Ingestion failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
