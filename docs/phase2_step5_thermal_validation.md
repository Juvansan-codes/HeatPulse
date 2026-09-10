# Phase 2 Step 5: Thermal Engine Cross-Validation

## Verdict

**PASS WITH LIMITATIONS**. The source dataset passes structural integrity and the independent pathways show the expected controlled responses. This is validation and characterization, not a claim that the indices are equivalent or medical outcome predictors.

## Recovery Assessment

The Step 4 parquet was present and was used as the sole source of truth. Step 5 initially contained only a partial synthetic test; no Step 5 analysis script or report was present. No upstream Step 2, 3, or 4 output was modified.

## Dataset Integrity

- **rows:** `438240`
- **expected_rows:** `438240`
- **row_count_ok:** `True`
- **grid_count:** `5`
- **grid_count_ok:** `True`
- **duplicate_timestamp_grid:** `0`
- **unique_timestamp_grid_ok:** `True`
- **ward_expansion_detected:** `False`
- **timestamp_continuity_ok:** `True`
- **per_grid_rows:** `{'12.800000,80.200000': 87648, '12.900000,80.200000': 87648, '13.000000,80.200000': 87648, '13.100000,80.200000': 87648, '13.200000,80.200000': 87648}`
- **nan_counts:** `{'temperature_2m': 0, 'relative_humidity': 0, 'mean_radiant_temp': 0, 'heat_index': 0, 'wbgt_outdoor': 0, 'utci': 0}`
- **numeric_ranges:** `{'relative_humidity_valid': True, 'wind_nonnegative': True, 'raw_ghi_nonnegative': False, 'raw_ghi_negative_count': 3940}`

Raw ERA5 SSRD-derived GHI contains 3,940 negative values. These are treated as nonphysical numerical/reanalysis artifacts and clipped to zero before radiation-dependent calculations. No negative GHI is used by the thermal calculations. The raw source parquet is preserved unchanged for provenance.

## Representative Conditions

Conditions are deterministic examples selected from the observed 2014-2023 data. They are not published risk categories.

| condition                         | timestamp           | grid                |     Ta |     RH |   wind |      GHI |   Tmrt |   Heat Index |   WBGT |   UTCI |
|:----------------------------------|:--------------------|:--------------------|-------:|-------:|-------:|---------:|-------:|-------------:|-------:|-------:|
| normal daytime                    | 2023-11-12 10:00:00 | 12.900000,80.200000 | 29.003 | 65.467 |  5.462 |  502.313 | 53.465 |       31.925 | 27.997 | 32.100 |
| hot/humid daytime                 | 2023-05-29 13:00:00 | 12.800000,80.200000 | 30.410 | 84.586 |  4.440 |   56.740 | 31.797 |       40.431 | 28.773 | 32.300 |
| hot/dry/high-radiation daytime    | 2021-04-02 07:00:00 | 13.100000,80.200000 | 38.085 | 28.818 |  2.431 | 1014.207 | 56.516 |       39.197 | 32.447 | 42.200 |
| hot/low-wind/high-radiation event | 2020-05-22 07:00:00 | 13.100000,80.200000 | 38.475 | 39.777 |  0.298 |  971.681 | 57.021 |       44.414 | 40.179 | 44.300 |
| cool/nighttime                    | 2018-02-01 01:00:00 | 13.100000,80.200000 | 15.757 | 95.453 |  1.540 |    0.000 |  7.376 |       15.881 | 15.041 | 13.200 |
| high-wind case                    | 2016-12-12 08:00:00 | 12.800000,80.200000 | 23.177 | 84.922 | 15.734 |   56.890 | 20.510 |       23.767 | 21.964 | 10.600 |

Heat Index is primarily an air-temperature/humidity formulation. Liljegren WBGT independently solves wet-bulb/globe balances using humidity, wind, and solar loading. UTCI uses humidity, wind, and the independently calculated Tmrt in its polynomial. Their values and rankings therefore need not agree.

## Controlled Physics

Expected one-variable responses were tested through the existing Step 3/4 implementations and the NOAA Heat Index implementation:

- **temperature:** `True`
- **humidity:** `True`
- **wind:** `True`
- **tmrt:** `True`
- **ghi:** `True`

The GHI test changes the WBGT radiation input and Tmrt together as a scenario; the Tmrt-only test isolates UTCI from WBGT. A zero-GHI nighttime case is retained as a radiation-pathway diagnostic. These tests do not force monotonicity outside the stated hot/daytime conditions.

## Top 20 UTCI Observations

| timestamp           |   grid_lat |   grid_lon |     Ta |     RH |   wind |     GHI |   Tmrt |   heat_index |   WBGT |   UTCI |
|:--------------------|-----------:|-----------:|-------:|-------:|-------:|--------:|-------:|-------------:|-------:|-------:|
| 2017-05-17 09:00:00 |     13.100 |     80.200 | 40.847 | 31.666 |  1.364 | 743.834 | 62.843 |       45.664 | 35.574 | 47.200 |
| 2017-05-17 09:00:00 |     13.000 |     80.200 | 40.497 | 32.545 |  0.782 | 740.441 | 62.617 |       45.366 | 36.754 | 46.900 |
| 2017-05-17 09:00:00 |     13.200 |     80.200 | 40.556 | 32.095 |  1.512 | 759.952 | 62.660 |       45.263 | 35.265 | 46.900 |
| 2017-05-17 09:00:00 |     12.900 |     80.200 | 40.259 | 32.380 |  0.223 | 743.906 | 62.384 |       44.775 | 40.311 | 46.600 |
| 2017-05-17 08:00:00 |     13.100 |     80.200 | 40.888 | 31.723 |  1.880 | 927.489 | 60.632 |       45.780 | 35.473 | 46.500 |
| 2017-05-17 10:00:00 |     13.100 |     80.200 | 40.468 | 32.209 |  2.102 | 638.209 | 62.468 |       45.132 | 34.313 | 46.500 |
| 2017-05-17 08:00:00 |     13.000 |     80.200 | 40.583 | 32.619 |  1.582 | 924.086 | 60.480 |       45.588 | 35.778 | 46.400 |
| 2017-05-18 08:00:00 |     13.100 |     80.200 | 40.761 | 32.132 |  2.386 | 846.571 | 61.328 |       45.721 | 34.813 | 46.400 |
| 2017-05-18 07:00:00 |     13.100 |     80.200 | 40.822 | 31.602 |  1.798 | 864.136 | 59.796 |       45.578 | 35.400 | 46.300 |
| 2017-05-17 08:00:00 |     12.900 |     80.200 | 40.462 | 32.279 |  1.606 | 920.031 | 60.356 |       45.155 | 35.577 | 46.200 |
| 2017-05-17 08:00:00 |     13.200 |     80.200 | 40.708 | 31.713 |  2.030 | 929.627 | 60.438 |       45.391 | 35.171 | 46.200 |
| 2017-05-17 10:00:00 |     13.200 |     80.200 | 40.222 | 32.571 |  2.043 | 634.713 | 62.203 |       44.790 | 34.224 | 46.200 |
| 2017-05-18 08:00:00 |     13.200 |     80.200 | 40.648 | 32.102 |  2.386 | 852.552 | 61.140 |       45.462 | 34.730 | 46.200 |
| 2015-05-25 09:00:00 |     13.100 |     80.200 | 40.083 | 30.088 |  1.553 | 843.708 | 62.267 |       43.336 | 34.710 | 46.100 |
| 2015-05-25 09:00:00 |     13.200 |     80.200 | 39.989 | 29.659 |  0.978 | 844.331 | 62.123 |       42.963 | 35.646 | 46.100 |
| 2017-05-18 07:00:00 |     13.000 |     80.200 | 40.340 | 33.369 |  1.237 | 863.245 | 59.589 |       45.445 | 36.199 | 46.100 |
| 2017-05-19 08:00:00 |     13.100 |     80.200 | 40.386 | 31.664 |  1.312 | 905.606 | 60.297 |       44.689 | 35.832 | 46.100 |
| 2017-05-19 09:00:00 |     13.100 |     80.200 | 40.167 | 32.255 |  2.188 | 750.544 | 62.278 |       44.520 | 34.235 | 46.100 |
| 2014-05-23 08:00:00 |     13.100 |     80.200 | 40.185 | 29.911 |  1.637 | 722.555 | 61.618 |       43.457 | 34.401 | 46.000 |
| 2017-05-17 06:00:00 |     13.100 |     80.200 | 40.455 | 32.931 |  2.388 | 924.131 | 60.908 |       45.472 | 34.888 | 46.000 |

The maxima should be interpreted as grid-level reanalysis/model events. They generally reflect high air temperature and Tmrt, with wind and daytime radiation contributing variably; identical ranking by Heat Index, WBGT, and UTCI is neither expected nor required.

## Correlation

Pearson and Spearman correlations are reported independently for all observations, daytime, nighttime, and hot conditions. Correlation describes co-variation in this dataset; it does not establish equivalence, causality, or health impact.

### All

| variable_1        | variable_2        |   pearson |   spearman |
|:------------------|:------------------|----------:|-----------:|
| temperature_2m    | temperature_2m    |     1.000 |      1.000 |
| temperature_2m    | relative_humidity |    -0.768 |     -0.745 |
| temperature_2m    | mean_radiant_temp |     0.735 |      0.821 |
| temperature_2m    | heat_index        |     0.952 |      0.962 |
| temperature_2m    | wbgt_outdoor      |     0.916 |      0.913 |
| temperature_2m    | utci              |     0.897 |      0.881 |
| relative_humidity | temperature_2m    |    -0.768 |     -0.745 |
| relative_humidity | relative_humidity |     1.000 |      1.000 |
| relative_humidity | mean_radiant_temp |    -0.770 |     -0.749 |
| relative_humidity | heat_index        |    -0.588 |     -0.577 |
| relative_humidity | wbgt_outdoor      |    -0.621 |     -0.611 |
| relative_humidity | utci              |    -0.701 |     -0.667 |
| mean_radiant_temp | temperature_2m    |     0.735 |      0.821 |
| mean_radiant_temp | relative_humidity |    -0.770 |     -0.749 |
| mean_radiant_temp | mean_radiant_temp |     1.000 |      1.000 |
| mean_radiant_temp | heat_index        |     0.632 |      0.740 |
| mean_radiant_temp | wbgt_outdoor      |     0.825 |      0.894 |
| mean_radiant_temp | utci              |     0.898 |      0.934 |
| heat_index        | temperature_2m    |     0.952 |      0.962 |
| heat_index        | relative_humidity |    -0.588 |     -0.577 |
| heat_index        | mean_radiant_temp |     0.632 |      0.740 |
| heat_index        | heat_index        |     1.000 |      1.000 |
| heat_index        | wbgt_outdoor      |     0.909 |      0.909 |
| heat_index        | utci              |     0.851 |      0.842 |
| wbgt_outdoor      | temperature_2m    |     0.916 |      0.913 |
| wbgt_outdoor      | relative_humidity |    -0.621 |     -0.611 |
| wbgt_outdoor      | mean_radiant_temp |     0.825 |      0.894 |
| wbgt_outdoor      | heat_index        |     0.909 |      0.909 |
| wbgt_outdoor      | wbgt_outdoor      |     1.000 |      1.000 |
| wbgt_outdoor      | utci              |     0.961 |      0.959 |
| utci              | temperature_2m    |     0.897 |      0.881 |
| utci              | relative_humidity |    -0.701 |     -0.667 |
| utci              | mean_radiant_temp |     0.898 |      0.934 |
| utci              | heat_index        |     0.851 |      0.842 |
| utci              | wbgt_outdoor      |     0.961 |      0.959 |
| utci              | utci              |     1.000 |      1.000 |

### Daytime

| variable_1        | variable_2        |   pearson |   spearman |
|:------------------|:------------------|----------:|-----------:|
| temperature_2m    | temperature_2m    |     1.000 |      1.000 |
| temperature_2m    | relative_humidity |    -0.749 |     -0.718 |
| temperature_2m    | mean_radiant_temp |     0.630 |      0.673 |
| temperature_2m    | heat_index        |     0.936 |      0.942 |
| temperature_2m    | wbgt_outdoor      |     0.862 |      0.870 |
| temperature_2m    | utci              |     0.884 |      0.885 |
| relative_humidity | temperature_2m    |    -0.749 |     -0.718 |
| relative_humidity | relative_humidity |     1.000 |      1.000 |
| relative_humidity | mean_radiant_temp |    -0.681 |     -0.683 |
| relative_humidity | heat_index        |    -0.510 |     -0.474 |
| relative_humidity | wbgt_outdoor      |    -0.492 |     -0.465 |
| relative_humidity | utci              |    -0.642 |     -0.620 |
| mean_radiant_temp | temperature_2m    |     0.630 |      0.673 |
| mean_radiant_temp | relative_humidity |    -0.681 |     -0.683 |
| mean_radiant_temp | mean_radiant_temp |     1.000 |      1.000 |
| mean_radiant_temp | heat_index        |     0.537 |      0.564 |
| mean_radiant_temp | wbgt_outdoor      |     0.692 |      0.730 |
| mean_radiant_temp | utci              |     0.808 |      0.827 |
| heat_index        | temperature_2m    |     0.936 |      0.942 |
| heat_index        | relative_humidity |    -0.510 |     -0.474 |
| heat_index        | mean_radiant_temp |     0.537 |      0.564 |
| heat_index        | heat_index        |     1.000 |      1.000 |
| heat_index        | wbgt_outdoor      |     0.898 |      0.906 |
| heat_index        | utci              |     0.854 |      0.852 |
| wbgt_outdoor      | temperature_2m    |     0.862 |      0.870 |
| wbgt_outdoor      | relative_humidity |    -0.492 |     -0.465 |
| wbgt_outdoor      | mean_radiant_temp |     0.692 |      0.730 |
| wbgt_outdoor      | heat_index        |     0.898 |      0.906 |
| wbgt_outdoor      | wbgt_outdoor      |     1.000 |      1.000 |
| wbgt_outdoor      | utci              |     0.943 |      0.956 |
| utci              | temperature_2m    |     0.884 |      0.885 |
| utci              | relative_humidity |    -0.642 |     -0.620 |
| utci              | mean_radiant_temp |     0.808 |      0.827 |
| utci              | heat_index        |     0.854 |      0.852 |
| utci              | wbgt_outdoor      |     0.943 |      0.956 |
| utci              | utci              |     1.000 |      1.000 |

### Nighttime

| variable_1        | variable_2        |   pearson |   spearman |
|:------------------|:------------------|----------:|-----------:|
| temperature_2m    | temperature_2m    |     1.000 |      1.000 |
| temperature_2m    | relative_humidity |    -0.512 |     -0.488 |
| temperature_2m    | mean_radiant_temp |     0.754 |      0.938 |
| temperature_2m    | heat_index        |     0.960 |      0.979 |
| temperature_2m    | wbgt_outdoor      |     0.912 |      0.908 |
| temperature_2m    | utci              |     0.855 |      0.856 |
| relative_humidity | temperature_2m    |    -0.512 |     -0.488 |
| relative_humidity | relative_humidity |     1.000 |      1.000 |
| relative_humidity | mean_radiant_temp |    -0.351 |     -0.378 |
| relative_humidity | heat_index        |    -0.357 |     -0.357 |
| relative_humidity | wbgt_outdoor      |    -0.128 |     -0.148 |
| relative_humidity | utci              |    -0.139 |     -0.140 |
| mean_radiant_temp | temperature_2m    |     0.754 |      0.938 |
| mean_radiant_temp | relative_humidity |    -0.351 |     -0.378 |
| mean_radiant_temp | mean_radiant_temp |     1.000 |      1.000 |
| mean_radiant_temp | heat_index        |     0.732 |      0.940 |
| mean_radiant_temp | wbgt_outdoor      |     0.715 |      0.902 |
| mean_radiant_temp | utci              |     0.792 |      0.896 |
| heat_index        | temperature_2m    |     0.960 |      0.979 |
| heat_index        | relative_humidity |    -0.357 |     -0.357 |
| heat_index        | mean_radiant_temp |     0.732 |      0.940 |
| heat_index        | heat_index        |     1.000 |      1.000 |
| heat_index        | wbgt_outdoor      |     0.940 |      0.969 |
| heat_index        | utci              |     0.880 |      0.902 |
| wbgt_outdoor      | temperature_2m    |     0.912 |      0.908 |
| wbgt_outdoor      | relative_humidity |    -0.128 |     -0.148 |
| wbgt_outdoor      | mean_radiant_temp |     0.715 |      0.902 |
| wbgt_outdoor      | heat_index        |     0.940 |      0.969 |
| wbgt_outdoor      | wbgt_outdoor      |     1.000 |      1.000 |
| wbgt_outdoor      | utci              |     0.917 |      0.921 |
| utci              | temperature_2m    |     0.855 |      0.856 |
| utci              | relative_humidity |    -0.139 |     -0.140 |
| utci              | mean_radiant_temp |     0.792 |      0.896 |
| utci              | heat_index        |     0.880 |      0.902 |
| utci              | wbgt_outdoor      |     0.917 |      0.921 |
| utci              | utci              |     1.000 |      1.000 |

### Hot

| variable_1        | variable_2        |   pearson |   spearman |
|:------------------|:------------------|----------:|-----------:|
| temperature_2m    | temperature_2m    |     1.000 |      1.000 |
| temperature_2m    | relative_humidity |    -0.683 |     -0.655 |
| temperature_2m    | mean_radiant_temp |     0.293 |      0.390 |
| temperature_2m    | heat_index        |     0.625 |      0.595 |
| temperature_2m    | wbgt_outdoor      |     0.491 |      0.490 |
| temperature_2m    | utci              |     0.701 |      0.691 |
| relative_humidity | temperature_2m    |    -0.683 |     -0.655 |
| relative_humidity | relative_humidity |     1.000 |      1.000 |
| relative_humidity | mean_radiant_temp |    -0.141 |     -0.157 |
| relative_humidity | heat_index        |     0.136 |      0.147 |
| relative_humidity | wbgt_outdoor      |    -0.007 |      0.027 |
| relative_humidity | utci              |    -0.323 |     -0.296 |
| mean_radiant_temp | temperature_2m    |     0.293 |      0.390 |
| mean_radiant_temp | relative_humidity |    -0.141 |     -0.157 |
| mean_radiant_temp | mean_radiant_temp |     1.000 |      1.000 |
| mean_radiant_temp | heat_index        |     0.252 |      0.367 |
| mean_radiant_temp | wbgt_outdoor      |     0.587 |      0.548 |
| mean_radiant_temp | utci              |     0.745 |      0.650 |
| heat_index        | temperature_2m    |     0.625 |      0.595 |
| heat_index        | relative_humidity |     0.136 |      0.147 |
| heat_index        | mean_radiant_temp |     0.252 |      0.367 |
| heat_index        | heat_index        |     1.000 |      1.000 |
| heat_index        | wbgt_outdoor      |     0.651 |      0.704 |
| heat_index        | utci              |     0.600 |      0.621 |
| wbgt_outdoor      | temperature_2m    |     0.491 |      0.490 |
| wbgt_outdoor      | relative_humidity |    -0.007 |      0.027 |
| wbgt_outdoor      | mean_radiant_temp |     0.587 |      0.548 |
| wbgt_outdoor      | heat_index        |     0.651 |      0.704 |
| wbgt_outdoor      | wbgt_outdoor      |     1.000 |      1.000 |
| wbgt_outdoor      | utci              |     0.864 |      0.888 |
| utci              | temperature_2m    |     0.701 |      0.691 |
| utci              | relative_humidity |    -0.323 |     -0.296 |
| utci              | mean_radiant_temp |     0.745 |      0.650 |
| utci              | heat_index        |     0.600 |      0.621 |
| utci              | wbgt_outdoor      |     0.864 |      0.888 |
| utci              | utci              |     1.000 |      1.000 |

## Published Classification References

| index      | source                                                                                                                | threshold_or_category                                                                                      |
|:-----------|:----------------------------------------------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------------------------------|
| Heat Index | NOAA/NWS Heat Index                                                                                                   | 80-90 F (caution); 90-105 F (extreme caution); 105-130 F (danger); >=130 F (extreme danger)                |
| WBGT       | NIOSH Criteria for a Recommended Standard: Occupational Exposure to Heat and Hot Environments (2016), screening table | Work/rest screening thresholds depend on workload and acclimatization; no single universal health category |
| UTCI       | UTCI operational categories, UTCI project / ISO 11079 context                                                         | 26-32 moderate heat; 32-38 strong heat; 38-46 very strong heat; >46 extreme heat stress                    |

The systems remain separate. NOAA/NWS Heat Index bands are apparent-temperature guidance. NIOSH WBGT screening limits vary by workload and acclimatization, so a single universal WBGT category would be misleading. UTCI stress bands describe modeled thermal stress. None is a medical diagnosis or mortality prediction.

## Temporal Characterization

Hourly and monthly means are included below. They are descriptive for 2014-2023 and should not be over-generalized as a climatology.

### Hour of Day

|   hour_of_day |   temperature_2m |   relative_humidity |   mean_radiant_temp |   heat_index |   wbgt_outdoor |   utci |
|--------------:|-----------------:|--------------------:|--------------------:|-------------:|---------------:|-------:|
|         0.000 |           25.366 |              85.605 |              18.887 |       27.345 |         23.805 | 24.406 |
|         1.000 |           25.347 |              85.685 |              21.506 |       27.338 |         23.860 | 25.060 |
|         2.000 |           26.207 |              82.009 |              28.558 |       28.611 |         25.119 | 27.360 |
|         3.000 |           27.646 |              74.593 |              40.662 |       30.487 |         26.936 | 30.824 |
|         4.000 |           28.905 |              68.044 |              49.025 |       32.076 |         28.368 | 33.319 |
|         5.000 |           29.961 |              63.182 |              53.219 |       33.353 |         29.363 | 34.928 |
|         6.000 |           30.783 |              59.822 |              54.430 |       34.288 |         29.966 | 35.743 |
|         7.000 |           31.262 |              58.146 |              53.818 |       34.876 |         30.232 | 35.937 |
|         8.000 |           31.473 |              57.452 |              54.439 |       35.144 |         30.197 | 36.170 |
|         9.000 |           31.341 |              58.109 |              54.285 |       35.071 |         29.823 | 35.952 |
|        10.000 |           30.875 |              60.136 |              51.684 |       34.669 |         29.171 | 34.925 |
|        11.000 |           30.144 |              63.526 |              45.827 |       33.990 |         28.349 | 33.052 |
|        12.000 |           29.198 |              68.310 |              35.975 |       33.006 |         27.767 | 30.331 |
|        13.000 |           28.183 |              73.677 |              26.551 |       31.805 |         25.742 | 27.725 |
|        14.000 |           27.525 |              77.420 |              21.115 |       30.972 |         25.130 | 26.077 |
|        15.000 |           27.115 |              79.788 |              20.754 |       30.408 |         24.988 | 25.793 |
|        16.000 |           26.794 |              81.519 |              20.459 |       29.923 |         24.854 | 25.584 |
|        17.000 |           26.519 |              82.817 |              20.192 |       29.469 |         24.713 | 25.405 |
|        18.000 |           26.274 |              83.782 |              19.939 |       29.027 |         24.563 | 25.236 |
|        19.000 |           26.264 |              83.779 |              19.924 |       29.005 |         24.545 | 25.237 |
|        20.000 |           26.062 |              84.286 |              19.695 |       28.603 |         24.387 | 25.072 |
|        21.000 |           25.855 |              84.770 |              19.460 |       28.216 |         24.222 | 24.892 |
|        22.000 |           25.664 |              85.141 |              19.239 |       27.870 |         24.063 | 24.705 |
|        23.000 |           25.500 |              85.412 |              19.046 |       27.580 |         23.922 | 24.539 |

### Month

|   month |   temperature_2m |   relative_humidity |   mean_radiant_temp |   heat_index |   wbgt_outdoor |   utci |
|--------:|-----------------:|--------------------:|--------------------:|-------------:|---------------:|-------:|
|   1.000 |           24.585 |              75.204 |              29.727 |       25.352 |         23.326 | 24.833 |
|   2.000 |           25.294 |              73.501 |              31.329 |       26.177 |         23.940 | 26.166 |
|   3.000 |           27.487 |              74.336 |              33.649 |       29.639 |         26.063 | 28.944 |
|   4.000 |           29.652 |              74.335 |              36.373 |       34.350 |         28.078 | 31.601 |
|   5.000 |           30.836 |              71.464 |              36.918 |       36.786 |         28.904 | 32.803 |
|   6.000 |           30.853 |              66.011 |              35.626 |       35.449 |         28.267 | 32.050 |
|   7.000 |           29.782 |              67.881 |              33.950 |       33.426 |         27.385 | 30.575 |
|   8.000 |           29.254 |              71.535 |              33.658 |       33.040 |         27.389 | 30.492 |
|   9.000 |           28.631 |              76.634 |              33.419 |       32.556 |         27.455 | 30.485 |
|  10.000 |           27.633 |              80.115 |              32.209 |       30.770 |         26.871 | 29.792 |
|  11.000 |           25.933 |              83.272 |              28.947 |       27.653 |         25.232 | 26.548 |
|  12.000 |           25.064 |              79.207 |              28.496 |       26.134 |         24.017 | 24.719 |

## Spatial Characterization

These are ERA5-Land grid-cell summaries, not ward-level measurements.

|   latitude |   longitude |   temperature_2m_mean |   tmrt_mean |   wbgt_mean |   utci_mean |   utci_p95 |
|-----------:|------------:|----------------------:|------------:|------------:|------------:|-----------:|
|     12.800 |      80.200 |                27.900 |      32.965 |      26.512 |      28.857 |     38.300 |
|     12.900 |      80.200 |                27.917 |      32.881 |      26.464 |      29.096 |     38.900 |
|     13.000 |      80.200 |                27.912 |      32.798 |      26.407 |      29.162 |     39.200 |
|     13.100 |      80.200 |                27.951 |      32.795 |      26.368 |      29.235 |     39.500 |
|     13.200 |      80.200 |                27.958 |      32.871 |      26.350 |      29.123 |     39.500 |

## Limitations

- Tmrt is a modeled approximation based on ERA5 radiation and documented assumptions, not a direct observation.
- ERA5-Land provides grid-level meteorology; ward-level precision is not implied.
- Thermal indices alone do not predict deaths, hospitalizations, or individual medical risk.
- The 2014-2023 period and five-grid pilot support characterization, not causal attribution.
- WBGT and UTCI use different wind/radiation conventions by design.

## Runtime and Memory

Measured report-generation runtime: **37.32 seconds**. Peak Python allocations measured by `tracemalloc`: **237.1 MiB**; this is not a process RSS measurement.

```text
python scripts/audit_phase2_step5_thermal_validation.py
```
