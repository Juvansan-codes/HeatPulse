# Chennai Data Validation Report

## 1. GCC Ward Boundaries (201 Geometries Investigated)
- **Source:** DataMeet Municipal Spatial Data
- **CRS:** Transformed to EPSG:4326 for final storage, processed with EPSG:32644 for area analysis.
- **Investigation Results:**
  - Total Features: 201
  - **Regular Wards:** 200 (IDs 1 through 200).
  - **The 201st Geometry:** Ward_No `0`, Zone_Name `St. Thomas Mount`. This is a Cantonment Board (military administration area) completely enclosed within Chennai but administratively distinct from the 200 GCC wards. 
  - **Validity:** All 201 geometries are valid. No duplicate Ward IDs exist among the regular wards. 
  - **Action Taken:** The Cantonment area (`Ward 0`) is acknowledged but filtered out during ward-to-ward Census demographic mapping.

## 2. Census 2011 Validation & Spatial Crosswalk
- **Source:** OpenCity Chennai Census 2011 Dataset (Tabular) and DataMeet Wards-2008 GeoJSON.
- **Investigation Results:**
  - The historical 2011 Census uses the pre-expansion **155-ward** geography. 
  - A spatial intersection overlay was performed between the historical 155-ward polygons and the modern 200-ward polygons.
  - **Spatial Relationships Discovered (Intersection Matrix):**
    - `1:1 matches`: 9
    - `1:many` (1 old ward splitting into many new wards): 48
    - `many:1` (many old wards merging into 1 new ward): 98
  - **Resolution Strategy:** Direct 1:1 join is impossible. An **area-weighted crosswalk** is required. 
  - **Limitation Acknowledgment:** Allocating population purely by geometric intersection area assumes uniform population density across the polygon, which may misrepresent highly dense slums or large unpopulated parks. This limitation will be documented in the vulnerability index methodology.

## 3. ERA5-Land Feasibility Test & Access
- **Status:** SUCCESS
- **Investigation Results:**
  - `cdsapi` successfully authenticated and submitted the job using the new Copernicus CDS Beta API.
  - Downloaded exactly 7 days of hourly data for May 2023 for the Chennai spatial bounding box.
  - The API payload was successfully received as a `.zip` file containing the `.nc` (NetCDF) grid.
  - `xarray` successfully parsed the NetCDF dimensions.
  - Derived variables (Relative Humidity via Magnus-Tetens, Wind Speed Magnitude) were successfully calculated from base variables.
  - **Next Step:** The ERA5-Land acquisition and processing pipeline has been successfully validated using a two-month historical subset. Full 2014–2023 acquisition remains in progress.
