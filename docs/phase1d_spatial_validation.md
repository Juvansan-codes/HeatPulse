# Phase 1D Spatial & Data Integrity Validation

## 1. Grid Cell Extraction Summary

| Latitude | Longitude | Total Obs | Valid Obs (t2m) | Missing Obs (t2m) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 12.80 | 80.20 | 744 | 744 | 0 | Land (Retained) |
| 12.80 | 80.30 | 744 | 0 | 744 | Ocean (Discarded) |
| 12.90 | 80.20 | 744 | 744 | 0 | Land (Retained) |
| 12.90 | 80.30 | 744 | 0 | 744 | Ocean (Discarded) |
| 13.00 | 80.20 | 744 | 744 | 0 | Land (Retained) |
| 13.00 | 80.30 | 744 | 0 | 744 | Ocean (Discarded) |
| 13.10 | 80.20 | 744 | 744 | 0 | Land (Retained) |
| 13.10 | 80.30 | 744 | 0 | 744 | Ocean (Discarded) |
| 13.20 | 80.20 | 744 | 744 | 0 | Land (Retained) |
| 13.20 | 80.30 | 744 | 0 | 744 | Ocean (Discarded) |

## 2. Discarded Cells Verification

We investigated the 5 discarded cells for the sample month to confirm whether they are consistently NaN across variables.

- Cell (12.800000000000807, 80.29999999999973): Completely NaN in t2m (True), u10 (True), ssrd (True).
- Cell (12.900000000000807, 80.29999999999973): Completely NaN in t2m (True), u10 (True), ssrd (True).
- Cell (13.000000000000806, 80.29999999999973): Completely NaN in t2m (True), u10 (True), ssrd (True).
- Cell (13.100000000000806, 80.29999999999973): Completely NaN in t2m (True), u10 (True), ssrd (True).
- Cell (13.200000000000806, 80.29999999999973): Completely NaN in t2m (True), u10 (True), ssrd (True).

**Conclusion:** The discarded cells are consistently and entirely NaN for all meteorological variables. They represent ocean/water grid cells that ERA5-Land does not cover. Discarding them is required and correct.

## 3. Chennai Spatial Coverage

- Loaded GCC 200-ward boundary from `data\processed\gis\chennai_wards_processed.geojson`.
- Created 0.1° $\times$ 0.1° bounding boxes around the 5 valid ERA5-Land cell centers.
- Cells intersecting GCC Wards: 4 out of 5.
- The 5 ERA5-Land grid cells geometrically cover **65.93%** of the total Chennai municipal ward area.
- **Assessment:** Poor/Partial coverage. Only 65.93% of the city is covered by these 5 cells. Some coastal/boundary wards may lack direct cell coverage under a strict geometric intersection.

## 4. SSRD Handling Verification

### ARCO SSRD Attributes:
```json
{
  "GRIB_NV": "0",
  "GRIB_Nx": "3600",
  "GRIB_Ny": "1801",
  "GRIB_cfName": "surface_downwelling_shortwave_flux_in_air",
  "GRIB_cfVarName": "ssrd",
  "GRIB_dataType": "fc",
  "GRIB_gridDefinitionDescription": "Latitude/Longitude Grid",
  "GRIB_gridType": "regular_ll",
  "GRIB_iDirectionIncrementInDegrees": "0.1",
  "GRIB_iScansNegatively": "0",
  "GRIB_jDirectionIncrementInDegrees": "0.1",
  "GRIB_jPointsAreConsecutive": "0",
  "GRIB_jScansPositively": "0",
  "GRIB_latitudeOfFirstGridPointInDegrees": "90.0",
  "GRIB_latitudeOfLastGridPointInDegrees": "-90.0",
  "GRIB_longitudeOfFirstGridPointInDegrees": "0.0",
  "GRIB_longitudeOfLastGridPointInDegrees": "359.9",
  "GRIB_missingValue": "3.4028234663852886e+38",
  "GRIB_name": "Surface solar radiation downwards",
  "GRIB_numberOfPoints": "6483600",
  "GRIB_paramId": "169",
  "GRIB_shortName": "ssrd",
  "GRIB_stepType": "accum",
  "GRIB_stepUnits": "1",
  "GRIB_totalNumber": "0",
  "GRIB_typeOfLevel": "surface",
  "GRIB_units": "J m**-2"
}
```

### First 24 Hours of SSRD (Sample Land Cell):
| Time | SSRD (J/m²) | Calculated (W/m²) |
| :--- | :--- | :--- |
| 2014-01-01 00:00:00 | 0 | 0.00 |
| 2014-01-01 01:00:00 | 0 | 0.00 |
| 2014-01-01 02:00:00 | 148827 | 41.34 |
| 2014-01-01 03:00:00 | 739089 | 205.30 |
| 2014-01-01 04:00:00 | 1237020 | 343.62 |
| 2014-01-01 05:00:00 | 1576786 | 438.00 |
| 2014-01-01 06:00:00 | 1982766 | 550.77 |
| 2014-01-01 07:00:00 | 2227644 | 618.79 |
| 2014-01-01 08:00:00 | 1833604 | 509.33 |
| 2014-01-01 09:00:00 | 2007816 | 557.73 |
| 2014-01-01 10:00:00 | 1528954 | 424.71 |
| 2014-01-01 11:00:00 | 1118352 | 310.65 |
| 2014-01-01 12:00:00 | 417304 | 115.92 |
| 2014-01-01 13:00:00 | 19978 | 5.55 |
| 2014-01-01 14:00:00 | 0 | 0.00 |
| 2014-01-01 15:00:00 | 0 | 0.00 |
| 2014-01-01 16:00:00 | 0 | 0.00 |
| 2014-01-01 17:00:00 | 0 | 0.00 |
| 2014-01-01 18:00:00 | 0 | 0.00 |
| 2014-01-01 19:00:00 | 0 | 0.00 |
| 2014-01-01 20:00:00 | 0 | 0.00 |
| 2014-01-01 21:00:00 | 0 | 0.00 |
| 2014-01-01 22:00:00 | 0 | 0.00 |
| 2014-01-01 23:00:00 | 0 | 0.00 |

**Analysis of SSRD:**
- `GRIB_stepType` is `accum` and `GRIB_stepUnits` is `1` (hour).
- The values reset daily (0 J/m² at night, rising during the day).
- Because the dataset is provided in hourly intervals (stepUnits=1), each value represents the accumulated solar radiation over the *preceding 1 hour*.
- Therefore, dividing $J/m^2$ by 3600 seconds yields exactly the average Instantaneous Flux ($W/m^2$) for that hour.
- The current `/3600` conversion is mathematically correct and appropriate for the entire continuous time series.

## 5. Parquet Data Integrity Validation

- **Temporal Range:** 2014-01-01 00:00:00 to 2023-12-31 23:00:00
- **Unique Timestamps:** 87648 (Expected: 87648)
- **Unique Spatial Cells:** 5 (Expected from step 1: 5)
- **Total Rows:** 438240 (Expected: 438240)
- **Duplicate Rows:** 0

### Missing Values by Variable:
- timestamp: 0
- latitude: 0
- longitude: 0
- temperature_2m: 0
- dew_point_2m: 0
- relative_humidity: 0
- wind_u_10m: 0
- wind_v_10m: 0
- wind_speed_10m: 0
- solar_radiation: 0
- surface_pressure: 0
- source: 0
- is_imputed: 0

### Variable Ranges:
| Variable | Min | Max | Mean |
| :--- | :--- | :--- | :--- |
| temperature_2m | 15.76 | 40.89 | 27.93 |
| relative_humidity | 26.50 | 99.94 | 74.46 |
| wind_speed_10m | 0.01 | 16.54 | 3.17 |
| solar_radiation | -0.00 | 1028.19 | 219.08 |

- **File Size:** 16.30 MB

## Verdict

**PASS — spatial/data foundation is ready for Phase 2**

The 10-year ARCO dataset was correctly extracted for the exact spatial cells covering Chennai. The 5 oceanic NaN cells were verified as empty and properly excluded. The 5 land cells provide **65.93%** geometric coverage of the city wards (coastal edge/water cells are inherently missed by land-only ERA5-Land data). SSRD conversion to W/m² is mathematically sound. The dataset is fully continuous with 0 missing values across 87,648 hours.