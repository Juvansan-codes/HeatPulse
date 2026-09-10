"""Extract and validate GCC's draft 200-ward Census-2011 schedule.

The source labels its identifiers "Proposed Ward No."  This script therefore
does not claim it is final/current-ward demographic data or build a master.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).parents[1]
PDF = ROOT / "data/raw/gis/gcc/DELIMITATION_OF_WARDS_DRAFT_PROPOSAL_ENGLISH.pdf"
GEOMETRY = ROOT / "data/raw/gis/gcc/EDP_wardBoundary_2025.geojson"
OUT = ROOT / "data/validation/gis/200ward_population_qc.csv"
SUMMARY = ROOT / "data/validation/gis/200ward_population_qc_summary.json"
SOURCE_URL = "https://www.chennaicorporation.gov.in/delimitation_draft/pdf/DELIMITATION_OF_WARDS_DRAFT_PROPOSAL_ENGLISH.pdf"

# Each Annexure I row has zone, proposed ward, buildings, households,
# population, difference, and percentage.  The final two fields are used only
# to distinguish a row from page-level summary values.
ROW = re.compile(r"^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(-?\d+)\s+(-?\d+\.\d+)", re.MULTILINE)


def extract_schedule(pdf: Path = PDF) -> pd.DataFrame:
    """Extract Annexure I(d) proposed-ward records from the official raw PDF."""
    from pypdf import PdfReader  # bundled workspace runtime dependency
    reader = PdfReader(str(pdf))
    records: list[dict] = []
    for page in reader.pages[3:18]:  # Annexure I(d), pages 4--18 in the PDF
        for zone, ward, buildings, households, population, _, _ in ROW.findall(page.extract_text() or ""):
            records.append({"ward": int(ward), "zone": int(zone), "source_residential_buildings_2011": int(buildings), "source_households_2011": int(households), "source_population_2011": int(population)})
    frame = pd.DataFrame(records).drop_duplicates()
    if len(frame) != 200 or frame["ward"].nunique() != 200 or set(frame["ward"]) != set(range(1, 201)):
        raise ValueError(f"PDF extraction did not produce a complete 1--200 schedule: {len(frame)} records, {frame.ward.nunique()} unique wards")
    return frame.sort_values("ward").reset_index(drop=True)


def validate(frame: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    geometry = json.loads(GEOMETRY.read_text(encoding="utf-8"))
    current_wards = {int(feature["properties"]["ward"]) for feature in geometry["features"]}
    result = frame.copy()
    result["geometry_match"] = result["ward"].isin(current_wards)
    result["duplicate_flag"] = result["ward"].duplicated(keep=False)
    result["missing_flag"] = False
    result["source_vintage"] = "Census 2011, GCC draft delimitation proposal"
    result["source_url"] = SOURCE_URL
    result["ward_identifier_mapping"] = "Draft 'Proposed Ward No.' numerically overlaps current `ward`, but final 2018 boundary changes/renumbering invalidate a direct geographic join."
    result["validation_status"] = "DRAFT_ID_MATCH_GEOGRAPHICALLY_INCOMPATIBLE"
    summary = {"conclusion": "NO AUTHORITATIVE CURRENT-200-WARD DATA FOUND", "source_records": len(result), "unique_source_wards": int(result.ward.nunique()), "missing_current_wards": sorted(current_wards - set(result.ward)), "extra_source_wards": sorted(set(result.ward) - current_wards), "duplicate_source_wards": int(result.ward.duplicated().sum()), "all_population_nonnegative": bool((result.source_population_2011 >= 0).all()), "all_households_nonnegative": bool((result.source_households_2011 >= 0).all()), "all_geometry_identifiers_match": bool(result.geometry_match.all()), "population_total": int(result.source_population_2011.sum()), "households_total": int(result.source_households_2011.sum()), "production_decision": "Do not merge: final 2018 boundary modifications and division renumbering make the draft schedule geographically incompatible with the current wards."}
    return result, summary


def main() -> None:
    schedule = extract_schedule()
    qc, summary = validate(schedule)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    qc.to_csv(OUT, index=False)
    SUMMARY.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
