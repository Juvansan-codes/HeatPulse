# ERA5-Land ARCO Zarr Investigation

Following the discovery of the Analysis-Ready, Cloud-Optimised (ARCO) Zarr stores officially provided by the Copernicus Climate Data Store (CDS), an investigation was conducted to determine feasibility for the SIH 2026 Thermal Engine pipeline.

## Findings

### 1. Availability of Required Variables
The ARCO Zarr store contains a curated subset of the most popular ERA5-Land variables. Official documentation confirms the availability of:
- 2m temperature
- 10m u-component of wind
- 10m v-component of wind
- surface pressure
- surface solar radiation downwards (SSRD)
*Note:* 2m dewpoint temperature is standard in ERA5 ARCO, but must be programmatically verified against the specific ERA5-Land ARCO endpoint upon connection.

### 2. Exact Variable Names
The variables follow standard ECMWF short names in `xarray`:
`t2m`, `d2m`, `u10`, `v10`, `sp`, `ssrd`.

### 3. Units
- Temperatures: Kelvin ($K$)
- Wind components: meters per second ($m/s$)
- Surface pressure: Pascals ($Pa$)
- Radiation: Joules per square meter ($J/m^2$)

### 4. Temporal Resolution
Hourly (`1h` frequency).

### 5. Spatial Resolution
0.1° × 0.1° (Approximately 9 km grid cells), natively preserving the official ERA5-Land resolution.

### 6. Bounding Box Selection (Chennai)
**YES.** Zarr is a cloud-native, chunked format. Unlike NetCDF over a REST API, you do not need to submit a geographical request to a queue. You can directly connect to the cloud store and slice the exact bounding box using standard Python:
`ds.sel(latitude=slice(13.25, 12.80), longitude=slice(80.10, 80.35))`

### 7. Xarray Access Efficiency
**Highly Efficient.** Zarr is specifically designed for `xarray.open_zarr()` using object storage backends (like `s3fs` or `gcsfs`). By using `consolidated=True`, `xarray` reads the entire metadata map in one fast network request, and then only downloads the specific data chunks corresponding to Chennai.

### 8. Full 2014–2023 Extraction (Avoiding 120 Requests)
**YES.** The Copernicus ARCO stores provide a **geo-chunked** store path. Geo-chunking optimizes the data structure exactly for our use case: extracting a long time-series (10 years) over a small spatial area (Chennai). This completely eliminates the CDS API queue limits and batching requirements. The entire decade can be loaded as a single logical datacube.

### 9. SSRD Accumulation Interpretation
**YES, SSRD is available.** 
*Crucial Difference:* Official ARCO documentation notes that for some Zarr repositories, accumulated variables (like radiation and precipitation) have been **pre-processed and de-accumulated** to represent discrete hourly values, drastically simplifying analysis. If we switch to ARCO, we must explicitly inspect the SSRD `attrs` (attributes) to confirm if it has been natively de-accumulated, or if we still need to apply the `/3600` conversion to achieve $W/m^2$.

### 10. Appropriateness for the Project
**Highly Appropriate and Reproducible.** 
Transitioning from the legacy CDS REST API (which downloads NetCDF files into local storage) to a cloud-native Zarr pipeline is the modern standard for geospatial data engineering. It will:
- Reduce our historical data acquisition time from ~20 hours to a few minutes.
- Remove the need for complex `manifest.csv` tracking, retry logic, and API timeout management.
- Allow us to query the data entirely in-memory, process the Thermal Engine, and dump the unified Parquet in one execution.

## Conclusion
The ERA5-Land ARCO Zarr pipeline is vastly superior for our Chennai historical use case. 

**Recommendation:** Proceed with migrating the `phase1d_era5_historical.py` pipeline to use `xarray.open_zarr` pointing to the official Copernicus ARCO store, bypassing the legacy CDS API file downloads entirely.
