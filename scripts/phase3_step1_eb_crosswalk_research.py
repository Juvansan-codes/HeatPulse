"""Evidence-first research gate for a 2011 Census EB -> GCC 200 ward crosswalk.

No EB-to-ward allocation is attempted.  A crosswalk is written only after an
authoritative, complete EB assignment is supplied and separately validated.
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).parents[1]
GCC = ROOT / "data/raw/gis/gcc/EDP_wardBoundary_2025.geojson"
CENSUS = ROOT / "data/raw/demographics/census/chennai_census_2011.csv"
MAPPING = ROOT / "data/processed/gis/spatial_ward_mapping.csv"
EVIDENCE = ROOT / "data/validation/gis/eb_crosswalk_research.csv"
QC = ROOT / "data/validation/gis/eb_crosswalk_qc.json"


def inspect() -> dict:
    census = pd.read_csv(CENSUS)
    mapping = pd.read_csv(MAPPING)
    geojson = json.loads(GCC.read_text(encoding="utf-8"))
    features = geojson["features"]
    properties = pd.DataFrame([feature["properties"] for feature in features])
    ward_numbers = pd.to_numeric(properties["ward"], errors="coerce")
    pair_duplicates = int(census[["Ward Number", "Enumberation Block"]].duplicated().sum())
    mapping_ids = set(pd.to_numeric(mapping["ward_id"], errors="coerce").dropna().astype(int))
    gcc_ward_numbers = set(ward_numbers.dropna().astype(int))
    evidence = pd.DataFrame([
        {"source": "Local Census EB extract", "document": CENSUS.name, "claim": "8,802 records use a historical ward and an EB/sub-EB label", "evidence_type": "local-file inspection", "coverage": "155 historical wards", "confidence": "high", "usable_for_production": False, "notes": "No coordinates or geometry columns; EB labels are not globally unique."},
        {"source": "GCC official GIS", "document": "EDP_wardBoundary_2025", "claim": "Official current geometry provides 200 ward polygons", "evidence_type": "downloaded FeatureServer GeoJSON inspection", "coverage": "200 current wards", "confidence": "high", "usable_for_production": True, "notes": "Use `ward` for the 1-200 ward number; `ward_id` is an internal feature identifier."},
        {"source": "Tamil Nadu Government Gazette", "document": "2018 delimitation, No. 408", "claim": "Delimitation was based on published 2011 Census figures and specifies ward boundaries", "evidence_type": "official document inspection", "coverage": "200 wards", "confidence": "high", "usable_for_production": False, "notes": "No explicit Census Enumeration Block-to-ward table was found; occurrences of 'EB' are electricity-board road/office references."},
        {"source": "Census of India", "document": "DCHB Chennai 2011 / PCA-TV PC11_PCA-TV-3302", "claim": "EBs were carved for enumeration; PCA-TV supplies ward-level tables", "evidence_type": "official catalogue/document inspection", "coverage": "Chennai Census 2011", "confidence": "high", "usable_for_production": False, "notes": "No official downloadable EB polygon/crosswalk source was located in inspected materials."},
        {"source": "OGD Chennai", "document": "Health Infrastructure : Chennai", "claim": "Catalogue describes ward-wise facilities and staffing", "evidence_type": "official catalogue inspection", "coverage": "unknown until export inspected", "confidence": "medium", "usable_for_production": False, "notes": "Resource export is not locally available; ward-ID compatibility cannot be tested."},
    ])
    qc = {
        "research_result": "CROSSWALK NOT PROVEN",
        "census": {"file": CENSUS.name, "rows": len(census), "columns": census.columns.tolist(), "historical_ward_count": int(census["Ward Number"].nunique()), "eb_label_column": "Enumberation Block", "eb_sub_eb_pair_duplicates": pair_duplicates, "global_eb_label_count": int(census["Enumberation Block"].nunique()), "has_geometry": False, "has_coordinates": False, "population_column": "Total Population", "population_sum": int(census["Total Population"].sum())},
        "gcc_geometry": {"file": GCC.name, "feature_count": len(features), "ward_number_column": "ward", "unique_ward_numbers": int(ward_numbers.nunique()), "missing_ward_numbers": int(ward_numbers.isna().sum()), "feature_identifier_column": "ward_id", "unique_feature_ids": int(properties["ward_id"].nunique()), "geometry_types": sorted({feature["geometry"]["type"] for feature in features}), "area_km2_min": float((properties["Shape__Area"] / 1_000_000).min()), "area_km2_max": float((properties["Shape__Area"] / 1_000_000).max())},
        "era5_mapping": {"rows": len(mapping), "unique_ward_ids": int(mapping["ward_id"].nunique()), "all_current_wards_covered": mapping_ids == gcc_ward_numbers},
        "health": {"local_export_present": False, "ward_id_compatibility_tested": False},
        "decision": "Do not create an EB crosswalk, reconstructed population, or 200-ward demographic master dataset.",
    }
    return {"evidence": evidence, "qc": qc}


def main() -> None:
    result = inspect()
    EVIDENCE.parent.mkdir(parents=True, exist_ok=True)
    result["evidence"].to_csv(EVIDENCE, index=False)
    QC.write_text(json.dumps(result["qc"], indent=2), encoding="utf-8")
    print(json.dumps(result["qc"], indent=2))


if __name__ == "__main__":
    main()
