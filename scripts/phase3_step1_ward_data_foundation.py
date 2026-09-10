"""Phase 3 Step 1 preflight gate for the ward data foundation.

This script deliberately does not create a ward master table until the official
200-ward geometry, a defensible Census crosswalk, and mapped health data exist.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

ROOT = Path(__file__).parents[1]
OFFICIAL_GCC_2025 = ROOT / "data/raw/gis/gcc/EDP_wardBoundary_2025.geojson"
CENSUS = ROOT / "data/raw/demographics/census/chennai_census_2011.csv"
MAPPING = ROOT / "data/processed/gis/spatial_ward_mapping.csv"
HEALTH_DIR = ROOT / "data/raw/health/chennai"
REPORT = ROOT / "data/validation/gis/phase3_step1_ward_data_foundation_preflight.json"

OFFICIAL_GCC_URL = "https://gisgcc.chennaicorporation.gov.in/server/rest/services/GCCDepts/EDPMobile2025/FeatureServer/2"
OFFICIAL_CENSUS_URL = "https://censusindia.gov.in/nada/index.php/catalog/6794"
OFFICIAL_HEALTH_URL = "https://sandbox.data.gov.in/catalog/health-infrastructure-chennai"


def _ids(frame: pd.DataFrame, column: str) -> dict[str, Any]:
    values = pd.to_numeric(frame[column], errors="coerce")
    return {"count": int(len(frame)), "unique_ids": int(values.nunique()), "missing_ids": int(values.isna().sum()), "duplicate_ids": int(values.duplicated().sum()), "min_id": None if values.dropna().empty else int(values.min()), "max_id": None if values.dropna().empty else int(values.max())}


def preflight(root: Path = ROOT) -> dict[str, Any]:
    """Inspect only local inputs and return an explicit proceed/block decision."""
    official_geometry = root / "data/raw/gis/gcc/EDP_wardBoundary_2025.geojson"
    census_path = root / "data/raw/demographics/census/chennai_census_2011.csv"
    mapping_path = root / "data/processed/gis/spatial_ward_mapping.csv"
    health_dir = root / "data/raw/health/chennai"
    issues: list[str] = []
    result: dict[str, Any] = {"official_sources": {"gcc_2025": OFFICIAL_GCC_URL, "census_pca_tv_2011": OFFICIAL_CENSUS_URL, "health_infrastructure": OFFICIAL_HEALTH_URL}, "inputs": {}}
    result["inputs"]["official_gcc_2025_present"] = official_geometry.exists()
    if not official_geometry.exists():
        issues.append("Official EDP_wardBoundary_2025 export is absent; the existing Datameet geometry must not substitute for it.")
    census = pd.read_csv(census_path)
    census_summary = _ids(census, "Ward Number")
    result["inputs"]["census_2011"] = {**census_summary, "columns": census.columns.tolist(), "grain": "enumeration block", "ward_count": census_summary["unique_ids"]}
    if census_summary["unique_ids"] != 200:
        issues.append(f"Census baseline contains {census_summary['unique_ids']} ward IDs, not 200 current GCC wards; direct ward-number joining is invalid.")
    mapping = pd.read_csv(mapping_path)
    mapping_summary = _ids(mapping, "ward_id")
    result["inputs"]["era5_mapping"] = {**mapping_summary, "grid_count": int(mapping["assigned_grid_id"].nunique()), "missing_grid_assignments": int(mapping["assigned_grid_id"].isna().sum())}
    if mapping_summary["unique_ids"] != 200 or mapping_summary["duplicate_ids"] or mapping["assigned_grid_id"].isna().any():
        issues.append("Existing ERA5 mapping fails its 200-ward relational coverage check.")
    health_files = sorted(health_dir.glob("*")) if health_dir.exists() else []
    result["inputs"]["health"] = {"directory_present": health_dir.exists(), "files": [item.name for item in health_files], "coverage": "not inspectable" if not health_files else "requires schema inspection"}
    if not health_files:
        issues.append("No official ward-wise health infrastructure export is present for schema, vintage, or ward-ID validation.")
    result["status"] = "BLOCKED" if issues else "READY_FOR_CROSSWALK_AND_MASTER_BUILD"
    result["blocking_issues"] = issues
    result["required_next_inputs"] = ["Official EDP_wardBoundary_2025 GeoJSON export", "Official Census PCA-TV/HL-14 files with definitions", "Official 2019-or-dated health infrastructure export", "Official delimitation/crosswalk evidence or validated spatial-overlap methodology"] if issues else []
    return result


def main() -> None:
    result = preflight()
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    if result["status"] == "BLOCKED":
        print("STOP: no ward master dataset was created.")


if __name__ == "__main__":
    main()
