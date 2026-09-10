# Phase 2: Spatial Ward to ERA5 Grid Mapping Report

## 1. Summary
- **Total Wards Processed:** 200
- **Ward_No=0 (Cantonment) Excluded:** True
- **Total ERA5-Land Grid Cells:** 5
- **Data Duplication:** No weather observations were duplicated or modified. The mapping is purely relational.

## 2. Distance Statistics
- **Minimum Assignment Distance:** 0.506 km
- **Maximum Assignment Distance:** 13.771 km
- **Mean Assignment Distance:** 5.951 km
- **Median Assignment Distance:** 5.539 km

## 3. Spatial Confidence
*Note: 10 km is a project-defined quality-control threshold.*
- **Normal assignments (<= 10 km):** 182
- **Lower-confidence assignments (> 10 km):** 18

## 4. Assignments by Grid Cell
- **grid_13_1_80_2**: 101 wards
- **grid_13_0_80_2**: 63 wards
- **grid_13_2_80_2**: 24 wards
- **grid_12_9_80_2**: 12 wards

## 5. Geometric Issues
- No unexpected geometry issues encountered. Wards were accurately projected to EPSG:32644 (UTM 44N) to calculate true geometric centroids before projecting back to EPSG:4326.
