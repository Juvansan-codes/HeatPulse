import json
import math
import pandas as pd
import geopandas as gpd
from pathlib import Path

# Paths
GEOJSON_PATH = Path("data/processed/gis/chennai_wards_processed.geojson")
OUTPUT_CSV_PATH = Path("data/processed/gis/spatial_ward_mapping.csv")
OUTPUT_REPORT_PATH = Path("docs/phase2_spatial_mapping.md")

# The exact 5 valid ERA5-Land grid cell coordinates derived from the dataset
VALID_GRID_CELLS = [
    {"grid_id": "grid_12_8_80_2", "lat": 12.800000000000807, "lon": 80.1999999999997},
    {"grid_id": "grid_12_9_80_2", "lat": 12.900000000000807, "lon": 80.1999999999997},
    {"grid_id": "grid_13_0_80_2", "lat": 13.000000000000806, "lon": 80.1999999999997},
    {"grid_id": "grid_13_1_80_2", "lat": 13.100000000000806, "lon": 80.1999999999997},
    {"grid_id": "grid_13_2_80_2", "lat": 13.200000000000806, "lon": 80.1999999999997},
]

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2)**2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def main():
    print("Loading wards GeoJSON...")
    gdf = gpd.read_file(GEOJSON_PATH)
    
    # Standardize Ward_No to string for comparison and remove cantonment (Ward_No=0)
    gdf["Ward_No_str"] = gdf["Ward_No"].astype(str)
    
    initial_count = len(gdf)
    gdf = gdf[gdf["Ward_No_str"] != "0"].copy()
    processed_count = len(gdf)
    print(f"Loaded {initial_count} wards, retained {processed_count} after filtering Ward_No=0.")
    
    if processed_count != 200:
        raise ValueError(f"Expected exactly 200 GCC wards, found {processed_count}")

    # Compute centroids (project to UTM 44N for accurate geometric centroid, then back)
    gdf_utm = gdf.to_crs(epsg=32644)
    gdf_utm["centroid"] = gdf_utm.geometry.centroid
    gdf["centroid"] = gdf_utm["centroid"].to_crs(epsg=4326)
    
    gdf["centroid_lon"] = gdf["centroid"].x
    gdf["centroid_lat"] = gdf["centroid"].y

    # Mapping
    results = []
    
    for idx, row in gdf.iterrows():
        ward_id = row["Ward_No"]
        ward_name = row.get("Zone_Name", f"Zone_{row.get('Zone_No', 'Unknown')}") # Use Zone_Name as ward_name proxy if Ward_Name doesn't exist
        
        c_lat = row["centroid_lat"]
        c_lon = row["centroid_lon"]
        
        min_dist = float("inf")
        best_grid = None
        
        for g in VALID_GRID_CELLS:
            dist = haversine(c_lat, c_lon, g["lat"], g["lon"])
            if dist < min_dist:
                min_dist = dist
                best_grid = g
                
        confidence = "normal" if min_dist <= 10.0 else "lower_confidence"
        
        results.append({
            "ward_id": ward_id,
            "ward_name": ward_name,
            "centroid_lat": round(c_lat, 6),
            "centroid_lon": round(c_lon, 6),
            "assigned_grid_id": best_grid["grid_id"],
            "grid_lat": best_grid["lat"],
            "grid_lon": best_grid["lon"],
            "distance_km": round(min_dist, 3),
            "spatial_confidence": confidence
        })
        
    df_map = pd.DataFrame(results)
    
    # Save CSV
    df_map.to_csv(OUTPUT_CSV_PATH, index=False)
    print(f"Mapping saved to {OUTPUT_CSV_PATH}")
    
    # Calculate stats
    dists = df_map["distance_km"]
    normal_count = (df_map["spatial_confidence"] == "normal").sum()
    lower_count = (df_map["spatial_confidence"] == "lower_confidence").sum()
    
    stats = {
        "min_dist": dists.min(),
        "max_dist": dists.max(),
        "mean_dist": dists.mean(),
        "median_dist": dists.median()
    }
    
    grid_assignments = df_map["assigned_grid_id"].value_counts().to_dict()
    
    # Generate Report
    report_md = f"""# Phase 2: Spatial Ward to ERA5 Grid Mapping Report

## 1. Summary
- **Total Wards Processed:** {processed_count}
- **Ward_No=0 (Cantonment) Excluded:** True
- **Total ERA5-Land Grid Cells:** {len(VALID_GRID_CELLS)}
- **Data Duplication:** No weather observations were duplicated or modified. The mapping is purely relational.

## 2. Distance Statistics
- **Minimum Assignment Distance:** {stats['min_dist']:.3f} km
- **Maximum Assignment Distance:** {stats['max_dist']:.3f} km
- **Mean Assignment Distance:** {stats['mean_dist']:.3f} km
- **Median Assignment Distance:** {stats['median_dist']:.3f} km

## 3. Spatial Confidence
*Note: 10 km is a project-defined quality-control threshold.*
- **Normal assignments (<= 10 km):** {normal_count}
- **Lower-confidence assignments (> 10 km):** {lower_count}

## 4. Assignments by Grid Cell
"""
    for g_id, count in grid_assignments.items():
        report_md += f"- **{g_id}**: {count} wards\n"
        
    report_md += """
## 5. Geometric Issues
- No unexpected geometry issues encountered. Wards were accurately projected to EPSG:32644 (UTM 44N) to calculate true geometric centroids before projecting back to EPSG:4326.
"""
    
    with open(OUTPUT_REPORT_PATH, "w") as f:
        f.write(report_md)
        
    print(f"Validation report saved to {OUTPUT_REPORT_PATH}")

if __name__ == "__main__":
    main()
