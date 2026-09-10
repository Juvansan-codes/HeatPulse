# Phase 2 Step 6 — Human Thermal Stress Index (HTSI)

## Purpose and scope

HTSI is a project-specific, operational, grid-level thermal-hazard index for Chennai. It describes modeled thermal intensity and recent persistence; it is not a medical diagnosis, mortality predictor, official IMD warning, or clinically validated index. Exposure and vulnerability (including demographics) remain outside HTSI and belong to a later risk layer. Ward outputs must be derived by joining the existing ward-to-grid mapping, never by duplicating weather facts.

## Formula

`HTSI = 0.64U + 0.16W + 0.10B24 + 0.06B72 + 0.04N`, clamped to 0–100. Equivalently, thermal hazard is `THS=0.80U+0.20W`; persistence is `P=0.50B24+0.30B72+0.20N`; `HTSI=0.80THS+0.20P`. These are project operational weights, not epidemiological weights.

`U` is a continuous UTCI score: ≤26°C maps through 0–20; 26/32/38/46°C map to 20/40/60/80, by piecewise-linear interpolation. The documented project cap rule linearly maps 46–56°C to 80–100, then clamps. The 46–56°C segment is a bounded scoring transformation introduced solely to map extreme UTCI values to the 80–100 operational score range; 56°C is not a physiological or medical threshold.

`W` is a project-specific local climatological WBGT anomaly. For each of the five grids, 2014–2023 empirical WBGT percentile maps P50/P90/P95/P97.5/P99 to 0/50/70/85/100, linearly between anchors, and clamps below/above P50/P99. P99 is not a medical danger threshold.

`B24` and `B72` are trailing, inclusive rolling means of `max(0,U-20)`, over 24 and 72 chronological hourly records per grid, divided by 80 and scaled to 0–100. At the start of history, all available current/past records are used (`min_periods=1`); no future record enters either window. These are project-specific burden metrics, not mortality doses.

`N` is a locally calibrated nighttime temperature anomaly. UTC timestamps are converted to IST (UTC+05:30); only 22:00–06:00 IST rows are nighttime. Within each grid's historical nighttime temperature population, the same P50/P90/P95/P97.5/P99 anchors produce `N`; daytime `N=0`. UTCI is deliberately not added to N, avoiding double counting with U and burden. No radiation quantity is introduced into nighttime stress.

Heat Index remains in the output as the NOAA/NWS apparent-temperature supporting indicator (with its caution, extreme-caution, danger, and extreme-danger interpretations). It is excluded from the weighted HTSI because Step 5 found substantial redundancy with temperature and the other thermal indices.

## Operational levels and events

The continuous historical baseline is split at its grid-level HTSI P50, P75, P90, and P97.5 into Levels 1–5: Normal, Moderate, High, Very High, and Extreme. HTSI alert levels are calibrated against the 2014–2023 Chennai historical distribution; they indicate relative operational severity rather than absolute medical danger. These are calibrated operational labels, not validated medical thresholds. `extreme_thermal_event` is separately true exactly when UTCI ≥46°C; it never overrides HTSI.

## Data and limitations

The new `htsi_2014_2023.parquet` retains one record per UTC timestamp/grid and stores explainability inputs, scores, burdens, IST-night indicator, level, flag, and provenance-quality label. It is derived from ERA5-Land and modeled Tmrt/WBGT/UTCI; it is grid-level, while ward-level derived risk references `assigned_grid_id`, centroid and mapping QC from the existing spatial mapping. It does not make ward-level observed-weather, medical, or mortality claims. The WBGT climatology is unconditional across the decade; seasonal/diurnal conditioning was not adopted because it was not finalized in the specified methodology.

## Validation and sensitivity

Tests cover range, UTCI and WBGT monotonicity/boundaries, trailing persistence/no future leakage, IST night conversion, missing input rejection, extreme flag, Heat Index presence, reproducibility, and retained grid cardinality. The generated sensitivity report compares 70/30, 80/20, and 90/10 UTCI/WBGT hazard weights plus nearby persistence alternatives using correlation, level changes, extreme-event category changes, and level distributions. The JSON report records descriptive historical checks, including monthly and IST-hour distributions and the top 20 modeled HTSI rows.

The reproducible 2014–2023 run created 438,240 unique timestamp/grid records across five grids. HTSI was 11.47–74.89 (mean 26.98; median 22.12); the operational-level counts were Normal 219,120, Moderate 109,560, High 65,736, Very High 32,868, and Extreme 10,956. There were 23 UTCI ≥46°C extreme thermal events. The 70/30 and 90/10 hazard variants correlated 0.9991 and 0.9989 with baseline and changed 7.45% and 8.49% of operational labels respectively; nearby persistence variants changed under 0.1%. No flagged extreme event changed operational level in those sensitivity runs. Results characterize modeled thermal conditions, not observed health events.
