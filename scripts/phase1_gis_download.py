import os
import requests
import json
import geopandas as gpd

# Paths
RAW_GIS_DIR = r"data\raw\gis\gcc"
PROCESSED_GIS_DIR = r"data\processed\gis"
VALIDATION_FILE = r"data\validation\gis\gcc_ward_validation.json"

RAW_GEOJSON_URL = "https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Chennai/Wards.geojson"
RAW_FILE_PATH = os.path.join(RAW_GIS_DIR, "chennai_wards_raw.geojson")
PROCESSED_FILE_PATH = os.path.join(PROCESSED_GIS_DIR, "chennai_wards_processed.geojson")

def run():
    print("Starting Phase 1A: GCC Ward Boundary Validation")
    
    # 1. Acquire raw source
    print(f"Downloading from {RAW_GEOJSON_URL}...")
    response = requests.get(RAW_GEOJSON_URL)
    response.raise_for_status()
    
    # 2. Preserve raw source
    with open(RAW_FILE_PATH, 'wb') as f:
        f.write(response.content)
    print(f"Saved raw GeoJSON to {RAW_FILE_PATH}")
    
    # 3. Inspect geometry and CRS
    gdf = gpd.read_file(RAW_FILE_PATH)
    print(f"Loaded GeoDataFrame with shape: {gdf.shape}")
    print(f"Initial CRS: {gdf.crs}")
    
    # 4. Count actual ward polygons
    ward_count = len(gdf)
    print(f"Actual ward polygons found: {ward_count}")
    
    # Check if the properties contain ward ID
    print("Columns available:", gdf.columns.tolist())
    
    # Usually datameet chennai wards have 'WARD_NO'
    # 5 & 6. Validate identifiers
    validation_results = {
        "source": RAW_GEOJSON_URL,
        "ward_count": ward_count,
        "crs": str(gdf.crs),
        "columns": gdf.columns.tolist()
    }
    
    if "Ward_No" in gdf.columns:
        ward_col = "Ward_No"
    elif "WARD_NO" in gdf.columns:
        ward_col = "WARD_NO"
    elif "ward_no" in gdf.columns:
        ward_col = "ward_no"
    elif "WARD_NUM" in gdf.columns:
        ward_col = "WARD_NUM"
    elif "WARD" in gdf.columns:
        ward_col = "WARD"
    else:
        ward_col = None
        
    if ward_col:
        unique_wards = gdf[ward_col].nunique()
        missing_wards = gdf[ward_col].isnull().sum()
        duplicates = ward_count - unique_wards
        
        validation_results["ward_identifier_column"] = ward_col
        validation_results["unique_wards"] = int(unique_wards)
        validation_results["missing_ids"] = int(missing_wards)
        validation_results["duplicate_ids"] = int(duplicates)
        
        print(f"Validation: {unique_wards} unique IDs, {missing_wards} missing, {duplicates} duplicates.")
    else:
        print("WARNING: No obvious WARD_NO column found.")
        validation_results["ward_identifier_column"] = None
        
    # 7. Check invalid/empty geometries
    invalid_geoms = (~gdf.is_valid).sum()
    empty_geoms = gdf.is_empty.sum()
    validation_results["invalid_geometries"] = int(invalid_geoms)
    validation_results["empty_geometries"] = int(empty_geoms)
    print(f"Validation: {invalid_geoms} invalid geometries, {empty_geoms} empty geometries.")
    
    # 8. Calculate spatial extent
    bounds = gdf.total_bounds
    validation_results["spatial_extent_bbox"] = bounds.tolist()
    print(f"Bounding Box (minx, miny, maxx, maxy): {bounds}")
    
    # 9. Generate processed GeoJSON
    # For now, just save a clean version (EPSG:4326)
    gdf = gdf.to_crs(epsg=4326)
    gdf.to_file(PROCESSED_FILE_PATH, driver="GeoJSON")
    print(f"Saved processed GeoJSON to {PROCESSED_FILE_PATH}")
    
    # 10. Document source and transformations
    with open(VALIDATION_FILE, 'w') as f:
        json.dump(validation_results, f, indent=4)
    print(f"Saved validation metadata to {VALIDATION_FILE}")

if __name__ == "__main__":
    run()
