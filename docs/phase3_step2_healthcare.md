# Phase 3 Step 2: Healthcare Facility Availability

## Result

`data/processed/gis/ward_healthcare_access_200.csv` contains exactly 200 current GCC 2025 wards. The local GCC PDF lists 140 Health and Wellness Centers with `Zone` and `Div` identifiers. All 140 source `(Zone, Div)` pairs exactly matched current geometry `(zone, ward)` pairs, so a ward-level facility count is defensible.

## Variables

- `healthcare_facility_count`: count of listed HWC/UPHC facilities per current ward.
- `healthcare_facilities_per_10000_derived_population`: facility count per 10,000 derived WorldPop 2020 population.
- `healthcare_confidence`: `MEDIUM` for the identifier join and availability proxy.

## Source and limitations

Source: `data/raw/health/gcc_urban_health_and_wellness_center_details.pdf`, also published at [GCC HWC details](https://chennaicorporation.gov.in/images/UrbanHealth_and_Wellness_Center_Details.pdf). The PDF vintage is not stated. It provides listed HWC/UPHC locations and addresses, not beds, staffing, throughput, catchment, opening status, or hospital capacity. This output must be called a **healthcare facility availability** or **primary healthcare access proxy**, not current hospital capacity.

The population denominator is modeled WorldPop R2025A 2020 population aggregated to current wards, not official current population.
