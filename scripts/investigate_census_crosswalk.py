import geopandas as gpd

print("--- Census Spatial Crosswalk Investigation ---")

# Load current 200 GCC Wards
gdf_current = gpd.read_file(r"data\raw\gis\gcc\chennai_wards_raw.geojson")
gdf_current = gdf_current[gdf_current['Ward_No'].astype(str) != '0'] # Filter out Cantonment
gdf_current = gdf_current.to_crs(epsg=32644) # Projected CRS for Area calculations

# Load historical 155 Wards
gdf_155 = gpd.read_file(r"data\raw\gis\gcc\chennai_wards_155_raw.geojson")
gdf_155 = gdf_155.to_crs(epsg=32644)

print(f"Current GCC Wards: {len(gdf_current)}")
print(f"Historical 155 Wards: {len(gdf_155)}")

# Overlay intersection
intersection = gpd.overlay(gdf_155, gdf_current, how='intersection')

# Calculate area
intersection['intersect_area'] = intersection.geometry.area

print("\nIntersection Matrix Details:")
print(f"Total intersection polygons: {len(intersection)}")

# Check relationships
# Count how many current wards a single historical ward intersects with (more than 5% area)
threshold_area = 100000 # 100,000 sq meters

relationships = {
    "1:1 matches": 0,
    "1:many (1 old -> many new)": 0,
    "many:1 (many old -> 1 new)": 0,
    "unmatched": 0
}

# Simple heuristic check
for old_ward in gdf_155['ward'].unique():
    intersections = intersection[intersection['ward'] == old_ward]
    major_intersections = intersections[intersections['intersect_area'] > threshold_area]
    
    if len(major_intersections) == 1:
        # Check if the new ward is only mapped to this old ward
        new_ward = major_intersections.iloc[0]['Ward_No']
        new_ward_intersections = intersection[intersection['Ward_No'] == new_ward]
        major_new_ward_intersections = new_ward_intersections[new_ward_intersections['intersect_area'] > threshold_area]
        
        if len(major_new_ward_intersections) == 1:
            relationships["1:1 matches"] += 1
        else:
            relationships["many:1 (many old -> 1 new)"] += 1
    elif len(major_intersections) > 1:
        relationships["1:many (1 old -> many new)"] += 1
    else:
        relationships["unmatched"] += 1

print("\nEstimated Spatial Relationships:")
for k, v in relationships.items():
    print(f"{k}: {v}")

print("\n--- Recommended Approach ---")
print("Area-weighted distribution is REQUIRED because 1:1 mapping is impossible.")
print("Assumption: Population is evenly distributed within the historical ward polygon.")
print("Limitation: Urban density is not uniform; allocating population purely by intersection area may misrepresent dense slums or large parks.")
