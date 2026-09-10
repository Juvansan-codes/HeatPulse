import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parents[1] / "scripts"))
from phase3_step1_current_200ward_data_research import inventory, validate


def test_official_geometry_and_existing_mapping_cover_current_200_wards():
    result = validate()
    assert result["official_geometry_features"] == 200
    assert result["official_geometry_unique_ward_numbers"] == 200
    assert result["official_geometry_has_1_to_200"]
    assert result["era5_mapping_rows"] == result["era5_mapping_unique_wards"] == 200


def test_inventory_has_required_provenance_schema_and_no_false_demographic_source():
    frame = inventory()
    required = {"source", "organization", "dataset", "url", "geographic_unit", "ward_count", "ward_id_field", "variables_available", "classification", "usable_for_production", "reason"}
    assert required.issubset(frame.columns)
    demographic_candidates = frame[frame["variables_available"].str.contains("population", case=False)]
    assert not demographic_candidates["usable_for_production"].any()


def test_no_synthetic_ward_demographic_master_exists():
    assert not validate()["demographic_master_exists"]
