"""Generate the Phase 2 Step 5 cross-validation audit report."""
from __future__ import annotations

import argparse
import time
import tracemalloc
from pathlib import Path

import pandas as pd

from phase2_step5_thermal_validation import (
    classification_reference,
    controlled_physics,
    correlations,
    load_source,
    representative_conditions,
    temporal_and_spatial,
    top_utci,
    validate_integrity,
)


def _table(frame: pd.DataFrame) -> str:
    return frame.to_markdown(index=False, floatfmt=".3f")


def build_report(root: str | Path = ".") -> str:
    data = load_source(root)
    integrity = validate_integrity(data)
    representatives = representative_conditions(data)
    physics = controlled_physics()
    corr = correlations(data)
    top = top_utci(data)
    (hourly, monthly), spatial = temporal_and_spatial(data)
    categories = classification_reference()
    raw_ghi_negative_count = integrity["numeric_ranges"]["raw_ghi_negative_count"]

    integrity_lines = "\n".join(f"- **{key}:** `{value}`" for key, value in integrity.items())
    physics_lines = "\n".join(f"- **{key}:** `{value}`" for key, value in physics["expected_direction"].items())
    correlation_sections = []
    for name, table in corr.items():
        correlation_sections.append(f"### {name.title()}\n\n{_table(table.reset_index().rename(columns={'level_0': 'variable_1', 'level_1': 'variable_2'}))}")
    correlation_text = "\n\n".join(correlation_sections)

    return f"""# Phase 2 Step 5: Thermal Engine Cross-Validation

## Verdict

**PASS WITH LIMITATIONS**. The source dataset passes structural integrity and the independent pathways show the expected controlled responses. This is validation and characterization, not a claim that the indices are equivalent or medical outcome predictors.

## Recovery Assessment

The Step 4 parquet was present and was used as the sole source of truth. Step 5 initially contained only a partial synthetic test; no Step 5 analysis script or report was present. No upstream Step 2, 3, or 4 output was modified.

## Dataset Integrity

{integrity_lines}

Raw ERA5 SSRD-derived GHI contains {raw_ghi_negative_count:,} negative values. These are treated as nonphysical numerical/reanalysis artifacts and clipped to zero before radiation-dependent calculations. No negative GHI is used by the thermal calculations. The raw source parquet is preserved unchanged for provenance.

## Representative Conditions

Conditions are deterministic examples selected from the observed 2014-2023 data. They are not published risk categories.

{_table(representatives)}

Heat Index is primarily an air-temperature/humidity formulation. Liljegren WBGT independently solves wet-bulb/globe balances using humidity, wind, and solar loading. UTCI uses humidity, wind, and the independently calculated Tmrt in its polynomial. Their values and rankings therefore need not agree.

## Controlled Physics

Expected one-variable responses were tested through the existing Step 3/4 implementations and the NOAA Heat Index implementation:

{physics_lines}

The GHI test changes the WBGT radiation input and Tmrt together as a scenario; the Tmrt-only test isolates UTCI from WBGT. A zero-GHI nighttime case is retained as a radiation-pathway diagnostic. These tests do not force monotonicity outside the stated hot/daytime conditions.

## Top 20 UTCI Observations

{_table(top)}

The maxima should be interpreted as grid-level reanalysis/model events. They generally reflect high air temperature and Tmrt, with wind and daytime radiation contributing variably; identical ranking by Heat Index, WBGT, and UTCI is neither expected nor required.

## Correlation

Pearson and Spearman correlations are reported independently for all observations, daytime, nighttime, and hot conditions. Correlation describes co-variation in this dataset; it does not establish equivalence, causality, or health impact.

{correlation_text}

## Published Classification References

{_table(categories)}

The systems remain separate. NOAA/NWS Heat Index bands are apparent-temperature guidance. NIOSH WBGT screening limits vary by workload and acclimatization, so a single universal WBGT category would be misleading. UTCI stress bands describe modeled thermal stress. None is a medical diagnosis or mortality prediction.

## Temporal Characterization

Hourly and monthly means are included below. They are descriptive for 2014-2023 and should not be over-generalized as a climatology.

### Hour of Day

{_table(hourly.reset_index().rename(columns={'hour': 'hour_of_day'}))}

### Month

{_table(monthly.reset_index().rename(columns={'month': 'month'}))}

## Spatial Characterization

These are ERA5-Land grid-cell summaries, not ward-level measurements.

{_table(spatial)}

## Limitations

- Tmrt is a modeled approximation based on ERA5 radiation and documented assumptions, not a direct observation.
- ERA5-Land provides grid-level meteorology; ward-level precision is not implied.
- Thermal indices alone do not predict deaths, hospitalizations, or individual medical risk.
- The 2014-2023 period and five-grid pilot support characterization, not causal attribution.
- WBGT and UTCI use different wind/radiation conventions by design.

## Runtime and Memory

Run with the command below. Runtime and peak memory depend on the local Python/Pandas/Arrow environment; the audit does not claim a fixed benchmark.

```text
python scripts/audit_phase2_step5_thermal_validation.py
```
"""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--output", default="docs/phase2_step5_thermal_validation.md")
    args = parser.parse_args()
    started = time.perf_counter()
    tracemalloc.start()
    report = build_report(args.root)
    _, peak_bytes = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - started
    report = report.replace(
        "Run with the command below. Runtime and peak memory depend on the local Python/Pandas/Arrow environment; the audit does not claim a fixed benchmark.",
        f"Measured report-generation runtime: **{elapsed:.2f} seconds**. Peak Python allocations measured by `tracemalloc`: **{peak_bytes / 1024 / 1024:.1f} MiB**; this is not a process RSS measurement.",
    )
    output = Path(args.root) / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(report, encoding="utf-8")
    print(f"Wrote {output} in {elapsed:.2f}s; peak Python allocations {peak_bytes / 1024 / 1024:.1f} MiB")


if __name__ == "__main__":
    main()
