import geopandas as gpd

# Load 201 wards
gdf = gpd.read_file(r"data\raw\gis\gcc\chennai_wards_raw.geojson")

print(f"Total Geometries: {len(gdf)}")

# Isolate Ward 0
ward_0 = gdf[gdf['Ward_No'].astype(str) == '0']
print("\n--- Feature Analysis: Ward 0 ---")
for col in ward_0.columns:
    print(f"{col}: {ward_0[col].values[0]}")

# Validate rest of wards
regular_wards = gdf[gdf['Ward_No'].astype(str) != '0']
print(f"\nRegular Wards Count: {len(regular_wards)}")

# Create Validation Table
validation_data = []
for idx, row in gdf.iterrows():
    ward_no = row.get('Ward_No', 'N/A')
    zone_name = row.get('Zone_Name', 'N/A')
    area = row.geometry.area
    valid = row.geometry.is_valid
    notes = "Cantonment Board" if str(ward_no) == '0' else "Regular Ward"
    validation_data.append({
        'Feature_Index': idx,
        'Ward_ID': ward_no,
        'Zone': zone_name,
        'Area': area,
        'Validity': valid,
        'Notes': notes
    })

print("\n--- Validation Table Summary ---")
print(f"Valid Geometries: {sum([x['Validity'] for x in validation_data])}/{len(validation_data)}")
print(f"Non-Regular Wards: {len([x for x in validation_data if x['Notes'] != 'Regular Ward'])}")

# Check for duplicates or overlapping polygons (basic check)
if len(regular_wards['Ward_No'].unique()) == len(regular_wards):
    print("\nNo duplicate Ward IDs among regular wards.")
else:
    print("\nWARNING: Duplicate Ward IDs found!")
