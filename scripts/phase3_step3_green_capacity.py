"""Document the current green/cooling data gate for Phase 3.

The available GCC park PDF is a 2016 maintenance artifact with historical
division labels and no current ward-compatible geometry. This step deliberately
omits a green variable rather than forcing a historical join or fabricating
satellite/OSM values.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).parents[1]
HISTORICAL_PARK = ROOT / "data/raw/gis/gcc/gcc_park_maintenance_details.pdf"
REPORT = ROOT / "data/validation/gis/phase3_step3_green_capacity_report.json"


def assess_green_data(root: Path = ROOT) -> dict:
    artifact = root / HISTORICAL_PARK.relative_to(ROOT)
    return {
        "status": "OMITTED",
        "green_variable": None,
        "source_checked": str(artifact.relative_to(root)),
        "source_vintage": 2016,
        "reason": "No current ward-compatible green/park geometry or defensible current satellite vegetation product was available in this implementation.",
        "historical_artifact_handling": "Retained as evidence/reference only; historical division labels were not joined to current 2025 wards.",
        "required_semantics": "A future spatial variable should be vegetation_fraction, green_cover_fraction, osm_mapped_park_area, or mapped_green_open_space; it must not be called public park area unless the source supports that meaning.",
    }


def main() -> None:
    report = assess_green_data()
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
