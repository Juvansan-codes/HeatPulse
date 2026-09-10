import geopandas as gpd
from shapely.geometry import Point
import pandas as pd

def run():
    print("--- Spatial Mapping Analysis (ERA5 Grid to GCC Wards) ---")
    
    # Load 200 regular GCC Wards
    gdf_wards = gpd.read_file(r"data\raw\gis\gcc\chennai_wards_raw.geojson")
    gdf_wards = gdf_wards[gdf_wards['Ward_No'].astype(str) != '0'] # Filter out Cantonment
    
    # Define the 15 ERA5 grid cell centers (from Chennai sample)
    era5_coords = [
        (80.1, 13.2), (80.2, 13.2), (80.3, 13.2),
        (80.1, 13.1), (80.2, 13.1), (80.3, 13.1),
        (80.1, 13.0), (80.2, 13.0), (80.3, 13.0),
        (80.1, 12.9), (80.2, 12.9), (80.3, 12.9),
        (80.1, 12.8), (80.2, 12.8), (80.3, 12.8),
    ]
    
    # ERA5 grid cells are ~0.1 degrees. Create bounding box for each cell (approx 9km x 9km)
    # A cell centered at (lon, lat) goes from lon-0.05 to lon+0.05, lat-0.05 to lat+0.05
    from shapely.geometry import box
    grid_polys = []
    for lon, lat in era5_coords:
        b = box(lon-0.05, lat-0.05, lon+0.05, lat+0.05)
        grid_polys.append({
            'era5_id': f"era5_{lat}_{lon}",
            'era5_lat': lat,
            'era5_lon': lon,
            'geometry': b
        })
        
    gdf_grid = gpd.GeoDataFrame(grid_polys, crs="EPSG:4326")
    
    print(f"Total Wards: {len(gdf_wards)}")
    print(f"Total ERA5 Grid Cells: {len(gdf_grid)}")
    
    # 1. Centroid Assignment (Nearest Grid Cell Center)
    gdf_wards['centroid'] = gdf_wards.geometry.centroid
    gdf_wards_centroids = gdf_wards.set_geometry('centroid')
    
    # Spatial join: nearest grid cell to each ward centroid
    # Since grid cells cover the area, we can just intersect the ward centroid with the grid polygon
    mapped = gpd.sjoin(gdf_wards_centroids, gdf_grid, how="left", predicate="intersects")
    
    assigned_cells = mapped['era5_id'].nunique()
    unassigned_wards = mapped['era5_id'].isnull().sum()
    
    print("\n--- Mapping Results ---")
    print("Method: Ward Centroid intersection with 0.1° ERA5 Grid Polygon")
    print(f"Wards successfully assigned to an ERA5 cell: {len(mapped) - unassigned_wards}")
    print(f"Unique ERA5 cells utilized for Chennai: {assigned_cells} (out of {len(gdf_grid)})")
    
    # Distribution of wards per ERA5 cell
    counts = mapped['era5_id'].value_counts()
    print("\nWards per ERA5 Cell:")
    print(counts)
    
    print("\n--- Limitations & Strategy ---")
    print("Because ERA5-Land resolution is ~9km, a single weather cell covers multiple small municipal wards.")
    print("Assigning raw ERA5 weather to a ward means ~30-50 adjacent wards will share identical weather data.")
    print("For higher spatial variance (hyperlocal), urban heat island (UHI) offsets or IoT sensors are required in future phases.")

if __name__ == "__main__":
    run()
