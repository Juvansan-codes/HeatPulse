"""Phase 3 Step 1C: evidence inventory for current-GCC-200-ward data only.

This is a discovery record, not a demographic processing pipeline.
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).parents[1]
GCC = ROOT / "data/raw/gis/gcc/EDP_wardBoundary_2025.geojson"
MAPPING = ROOT / "data/processed/gis/spatial_ward_mapping.csv"
OUT = ROOT / "data/validation/gis/current_200ward_data_inventory.csv"


def inventory() -> pd.DataFrame:
    """Return researched candidates; A means direct current-200-ward use only."""
    return pd.DataFrame([
        {"source": "Greater Chennai Corporation GIS", "organization": "Greater Chennai Corporation", "dataset": "EDP_wardBoundary_2025", "url": "https://gisgcc.chennaicorporation.gov.in/server/rest/services/GCCDepts/EDPMobile2025/FeatureServer/2", "publication_date": "2025 (layer name)", "update_date": "not supplied", "geographic_unit": "current GCC wards", "ward_count": 200, "ward_id_field": "ward", "variables_available": "ward, zone_id, zone, region, ac_name, ac_no, geometry, Shape__Area, Shape__Length", "source_type": "official GIS FeatureServer", "classification": "A — DIRECTLY USABLE", "usable_for_production": True, "reason": "Direct official current-200-ward geometry; no demographic values.", "notes": "`ward_id` is a GIS internal ID, not the 1–200 ward number."},
        {"source": "Greater Chennai Corporation GIS", "organization": "Greater Chennai Corporation", "dataset": "EDPMobile2025 FeatureServer service inventory", "url": "https://gisgcc.chennaicorporation.gov.in/server/rest/services/GCCDepts/EDPMobile2025/FeatureServer", "publication_date": "2025 (service name)", "update_date": "not supplied", "geographic_unit": "GCC", "ward_count": None, "ward_id_field": "not applicable", "variables_available": "EDP_Roads_2025; EDP_zoneBoundary_2025; EDP_wardBoundary_2025; no tables", "source_type": "official GIS service metadata", "classification": "D — NOT USABLE", "usable_for_production": False, "reason": "Service has no population, household, health, park, building, or socioeconomic layer/table.", "notes": "Road attributes can be investigated later, but are not a ward demographic dataset."},
        {"source": "Census of India", "organization": "Office of the Registrar General & Census Commissioner, India", "dataset": "PCA-TV Chennai 2011 (PC11_PCA-TV-3302)", "url": "https://censusindia.gov.in/nada/index.php/catalog/6794", "publication_date": "2011", "update_date": "catalogue modified 2021", "geographic_unit": "2011 Chennai wards", "ward_count": 155, "ward_id_field": "Ward Number", "variables_available": "population, sex, age 0–6, households, literacy, workers and related PCA fields", "source_type": "official Census table", "classification": "D — NOT USABLE", "usable_for_production": False, "reason": "Historical 155-ward geography; no authoritative 155-to-current-200 crosswalk.", "notes": "Historical baseline only; must not be called current population."},
        {"source": "Open Government Data India", "organization": "MoHUA Smart Cities Mission / Chennai", "dataset": "City Profile : Chennai", "url": "https://ap.data.gov.in/catalog/city-profile-chennai", "publication_date": "2019-02-08", "update_date": "2025-02-14", "geographic_unit": "city", "ward_count": None, "ward_id_field": "not documented", "variables_available": "city area, population, workforce participation, households", "source_type": "official OGD catalogue", "classification": "D — NOT USABLE", "usable_for_production": False, "reason": "Catalogue describes city-level indicators, not current 200-ward records.", "notes": "Could provide aggregate context only."},
        {"source": "Open Government Data India", "organization": "MoHUA Smart Cities Mission / Chennai", "dataset": "Health Infrastructure : Chennai", "url": "https://ap.data.gov.in/catalog/health-infrastructure-chennai", "publication_date": "2019-06-28", "update_date": "2025-02-18", "geographic_unit": "ward claimed by catalogue", "ward_count": None, "ward_id_field": "not inspectable", "variables_available": "catalogue claims facility, beds, doctors, physicians, nurses, midwives", "source_type": "official OGD catalogue", "classification": "D — NOT USABLE", "usable_for_production": False, "reason": "Actual export/resource and ward-ID scheme were unavailable for inspection; current-200 compatibility is unproven.", "notes": "Historical capacity/vintage must be retained if obtained."},
        {"source": "Tamil Nadu Government Gazette", "organization": "Tamil Nadu / Chennai City Municipal Corporation", "dataset": "2018 final 200-ward delimitation, Gazette No. 408", "url": "https://chennaicorporation.gov.in/gcc/delimited_ward/pdf/2018_delimitation.pdf", "publication_date": "2018-12-14", "update_date": "not applicable", "geographic_unit": "200 territorial wards", "ward_count": 200, "ward_id_field": "Ward No", "variables_available": "boundary schedules", "source_type": "official Gazette", "classification": "D — NOT USABLE", "usable_for_production": False, "reason": "Uses 2011 Census figures for delimitation but contains no ward-wise demographic or household table.", "notes": "Does not establish an EB crosswalk."},
    ])


def validate() -> dict:
    geometry = json.loads(GCC.read_text(encoding="utf-8"))
    wards = pd.to_numeric(pd.Series([item["properties"]["ward"] for item in geometry["features"]]), errors="coerce")
    mapping = pd.read_csv(MAPPING)
    return {"official_geometry_features": len(geometry["features"]), "official_geometry_unique_ward_numbers": int(wards.nunique()), "official_geometry_has_1_to_200": set(wards.dropna().astype(int)) == set(range(1, 201)), "era5_mapping_rows": len(mapping), "era5_mapping_unique_wards": int(mapping["ward_id"].nunique()), "demographic_master_exists": (ROOT / "data/processed/gis/ward_data_foundation.csv").exists()}


def main() -> None:
    frame = inventory()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(OUT, index=False)
    print(json.dumps(validate(), indent=2))
    print("Conclusion: NO CURRENT 200-WARD DEMOGRAPHIC DATA FOUND")


if __name__ == "__main__":
    main()
