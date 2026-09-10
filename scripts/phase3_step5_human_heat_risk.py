"""Integrate HTSI, ward exposure, vulnerability, and optional proxies.

The default output is one historical HTSI snapshot per current ward. The full
thermal fact table is not duplicated to ward-hour records.
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).parents[1]
HTSI = ROOT / "data/processed/weather/htsi_2014_2023.parquet"
MAPPING = ROOT / "data/processed/gis/spatial_ward_mapping.csv"
VULNERABILITY = ROOT / "data/processed/risk/ward_vulnerability_200.csv"
OUTPUT = ROOT / "data/processed/risk/ward_heat_risk_latest_snapshot.csv"
REPORT = ROOT / "data/validation/risk/phase3_step5_human_heat_risk_report.json"


def minmax(values: pd.Series) -> pd.Series:
    low, high = float(values.min()), float(values.max())
    if high == low:
        return pd.Series(0.0, index=values.index)
    return (values - low) / (high - low)


def _merge_grid_snapshot(htsi: pd.DataFrame, mapping: pd.DataFrame, timestamp: str | None) -> tuple[pd.DataFrame, pd.Timestamp]:
    htsi = htsi.copy()
    htsi["timestamp"] = pd.to_datetime(htsi["timestamp"])
    selected_timestamp = pd.Timestamp(timestamp) if timestamp else htsi["timestamp"].max()
    selected = htsi[htsi["timestamp"] == selected_timestamp].copy()
    if selected.empty:
        raise ValueError(f"No HTSI records found at timestamp {selected_timestamp}")
    if selected["grid_id"].duplicated().any():
        raise ValueError("HTSI snapshot has duplicate grid records")
    selected["join_lat"] = selected["latitude"].round(6)
    selected["join_lon"] = selected["longitude"].round(6)
    mapping = mapping.copy()
    mapping["join_lat"] = mapping["grid_lat"].round(6)
    mapping["join_lon"] = mapping["grid_lon"].round(6)
    joined = mapping.merge(selected, on=["join_lat", "join_lon"], how="left", validate="many_to_one")
    if joined["htsi"].isna().any():
        raise ValueError("Some current wards have no HTSI grid assignment")
    return joined, selected_timestamp


def build_risk(root: Path = ROOT, timestamp: str | None = None) -> tuple[pd.DataFrame, dict]:
    vulnerability = pd.read_csv(root / VULNERABILITY.relative_to(ROOT))
    mapping = pd.read_csv(root / MAPPING.relative_to(ROOT))
    htsi = pd.read_parquet(root / HTSI.relative_to(ROOT))
    joined, selected_timestamp = _merge_grid_snapshot(htsi, mapping, timestamp)
    frame = joined.merge(vulnerability, on="ward_id", how="inner", validate="one_to_one")
    if len(frame) != 200 or frame["ward_id"].nunique() != 200:
        raise ValueError("Risk integration does not contain exactly 200 unique wards")
    frame["exposure_population_density"] = minmax(frame["population_density"])
    frame["heat_hazard"] = (frame["htsi"] / 100).clip(0, 1)
    frame["human_heat_risk_formula_a"] = frame["heat_hazard"] * frame["exposure_population_density"] * frame["vulnerability"]
    frame["human_heat_risk_formula_b"] = frame["heat_hazard"] * frame["exposure_population_density"] * (0.5 + 0.5 * frame["vulnerability"])
    frame["human_heat_risk"] = frame["human_heat_risk_formula_b"]
    frame["risk_formula_selected"] = "H x E x (0.5 + 0.5V)"
    frame["risk_interpretation"] = "Ward-level Heat Impact Risk operational prioritization score; not mortality probability or medical risk"
    frame["green_cooling_variable"] = pd.NA
    frame["green_cooling_status"] = "OMITTED: no current ward-compatible green spatial source"
    frame["slum_informal_settlement_variable"] = pd.NA
    frame["slum_data_status"] = "OMITTED: current authoritative ward-compatible slum/informal-settlement spatial data were not available for this implementation."
    frame["healthcare_access_proxy"] = frame["healthcare_facilities_per_10000_derived_population"]
    frame["data_quality"] = "HTSI historical grid snapshot joined to current 2025 wards; WorldPop and HWC proxies derived"
    frame["data_quality_confidence"] = "LOW_TO_MEDIUM"
    keep = [
        "ward_id", "ward_name", "assigned_grid_id", "timestamp", "grid_id", "htsi", "htsi_level", "htsi_label", "utci", "wbgt_outdoor",
        "population", "population_density", "exposure_population_density", "vulnerability", "heat_hazard", "human_heat_risk",
        "human_heat_risk_formula_a", "human_heat_risk_formula_b", "healthcare_access_proxy", "healthcare_facility_count",
        "green_cooling_variable", "green_cooling_status", "slum_informal_settlement_variable", "slum_data_status", "data_quality", "data_quality_confidence",
    ]
    output = frame[keep].sort_values("ward_id").reset_index(drop=True)
    report = {
        "status": "PASS_WITH_LIMITATIONS",
        "rows": len(output),
        "ward_count": int(output["ward_id"].nunique()),
        "selected_timestamp": str(selected_timestamp),
        "htsi_source": str(HTSI.relative_to(root)),
        "htsi_source_rows_unchanged": int(len(htsi)),
        "formula_a": "H x E x V",
        "formula_b": "H x E x (0.5 + 0.5V)",
        "selected_formula": "H x E x (0.5 + 0.5V)",
        "selection_reason": "Retains hazard and population-density exposure even when reduced vulnerability is low; avoids zeroing operational prioritization from incomplete vulnerability evidence.",
        "risk_semantics": "Ward-level Heat Impact Risk operational prioritization score; not mortality probability, death prediction, medical risk, or clinically validated health score.",
        "omitted_variables": [
            "green/cooling: no current ward-compatible spatial source",
            "slum/informal settlement: current authoritative ward-compatible spatial data were not available for this implementation",
            "elderly, disability, chronic disease, mortality, hospitalization, and other demographic outcomes: no compatible authoritative current-200-ward data",
        ],
    }
    return output, report


def main() -> None:
    output, report = build_risk()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    output.to_csv(OUTPUT, index=False)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
