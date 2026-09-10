"""Build a defensible HWC/UPHC availability proxy for current GCC wards.

The source lists GCC Zone and Division identifiers, not coordinates, staffing,
beds, or service capacity. The identifiers are joined to current ward numbers
only after an exact (zone, division) cross-check against the 2025 geometry.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd

try:
    from pypdf import PdfReader
except ImportError as error:  # pragma: no cover - dependency is required to run the extractor
    raise RuntimeError("Install pypdf to extract the local GCC HWC PDF") from error

ROOT = Path(__file__).parents[1]
PDF = ROOT / "data/raw/health/gcc_urban_health_and_wellness_center_details.pdf"
GEO = ROOT / "data/raw/gis/gcc/EDP_wardBoundary_2025.geojson"
EXPOSURE = ROOT / "data/processed/gis/ward_exposure_200.csv"
OUTPUT = ROOT / "data/processed/gis/ward_healthcare_access_200.csv"
REPORT = ROOT / "data/validation/gis/phase3_step2_healthcare_report.json"
SOURCE_URL = "https://chennaicorporation.gov.in/images/UrbanHealth_and_Wellness_Center_Details.pdf"


def extract_facilities(pdf_path: Path = PDF) -> pd.DataFrame:
    text = "\n".join((page.extract_text() or "") for page in PdfReader(str(pdf_path)).pages)
    rows: list[dict] = []
    current: dict | None = None
    for line in text.splitlines():
        match = re.match(r"^\s*(\d+)\s+(\d+)\s+(\d+)(?:\s+(.*))?$", line.strip())
        if not match:
            if current and line.strip():
                current["address_excerpt"] += " " + line.strip()
            continue
        if current:
            rows.append(current)
            current = None
        serial, zone, division, address = match.groups()
        serial_id, zone_id, division_id = int(serial), int(zone), int(division)
        if 1 <= serial_id <= 140 and 1 <= division_id <= 200:
            current = {"source_serial": serial_id, "source_zone": zone_id, "ward_id": division_id, "address_excerpt": (address or "").strip()}
    if current:
        rows.append(current)
    facilities = pd.DataFrame(rows)
    if len(facilities) != 140 or facilities["source_serial"].nunique() != 140:
        raise ValueError(f"Expected 140 HWC records, parsed {len(facilities)}")
    if facilities["ward_id"].duplicated().any():
        raise ValueError("HWC source contains duplicate division identifiers")
    return facilities


def _current_pairs(geo_path: Path = GEO) -> set[tuple[int, int]]:
    payload = json.loads(geo_path.read_text(encoding="utf-8"))
    return {(int(feature["properties"]["ward"]), int(feature["properties"]["zone"])) for feature in payload["features"]}


def build_healthcare(root: Path = ROOT) -> tuple[pd.DataFrame, dict]:
    pdf = root / PDF.relative_to(ROOT)
    geo = root / GEO.relative_to(ROOT)
    exposure = pd.read_csv(root / EXPOSURE.relative_to(ROOT))
    facilities = extract_facilities(pdf)
    pairs = _current_pairs(geo)
    source_pairs = set(zip(facilities["ward_id"], facilities["source_zone"]))
    if not source_pairs <= pairs:
        raise ValueError("HWC Zone/Division identifiers do not exactly match current ward/zone pairs")
    counts = facilities.groupby("ward_id", as_index=False).size().rename(columns={"size": "healthcare_facility_count"})
    output = exposure[["ward_id", "population", "population_density"]].merge(counts, on="ward_id", how="left")
    output["healthcare_facility_count"] = output["healthcare_facility_count"].fillna(0).astype(int)
    output["healthcare_facilities_per_10000_derived_population"] = output["healthcare_facility_count"] / output["population"] * 10000
    output["healthcare_source"] = "GCC 140 Health and Wellness Centers Location Details PDF"
    output["healthcare_source_url"] = SOURCE_URL
    output["healthcare_source_vintage"] = "PDF vintage not stated; local source preserved"
    output["healthcare_mapping_method"] = "Exact source Zone/Div to current GCC 2025 zone/ward identifier match"
    output["healthcare_confidence"] = "MEDIUM"
    output["healthcare_interpretation"] = "HWC/UPHC availability proxy; not hospital capacity"
    output = output.sort_values("ward_id").reset_index(drop=True)
    report = {
        "status": "PASS_WITH_LIMITATIONS",
        "source": str(pdf.relative_to(root)),
        "source_url": SOURCE_URL,
        "source_vintage": "PDF vintage not stated",
        "facility_records": int(len(facilities)),
        "mapped_facility_records": int(len(source_pairs)),
        "current_ward_coverage": int(len(output)),
        "wards_with_facility": int((output.healthcare_facility_count > 0).sum()),
        "mapping_check": "all 140 Zone/Div pairs exactly matched current 2025 zone/ward pairs",
        "limitations": [
            "The source lists HWC/UPHC locations and identifiers, not beds, staffing, throughput, catchment, or hospital capacity.",
            "The source PDF does not state a publication vintage; preserve this uncertainty.",
            "Facilities per 10,000 uses derived WorldPop 2020 population and is an access-availability proxy only.",
        ],
    }
    return output, report


def main() -> None:
    output, report = build_healthcare()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    output.to_csv(OUTPUT, index=False)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
