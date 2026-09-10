import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parents[1] / "scripts"))
from phase3_step1_eb_crosswalk_research import inspect


def test_official_gcc_geometry_has_200_unique_current_ward_numbers():
    qc = inspect()["qc"]["gcc_geometry"]
    assert qc["feature_count"] == 200
    assert qc["unique_ward_numbers"] == 200
    assert qc["missing_ward_numbers"] == 0
    assert qc["area_km2_min"] > 0


def test_eb_labels_are_unique_only_at_the_historical_ward_plus_label_grain():
    census = inspect()["qc"]["census"]
    assert census["historical_ward_count"] == 155
    assert census["eb_sub_eb_pair_duplicates"] == 0
    assert census["global_eb_label_count"] < census["rows"]
    assert not census["has_geometry"] and not census["has_coordinates"]


def test_existing_era5_mapping_covers_official_current_ward_number_field():
    mapping = inspect()["qc"]["era5_mapping"]
    assert mapping["rows"] == 200
    assert mapping["unique_ward_ids"] == 200
    assert mapping["all_current_wards_covered"]


def test_crosswalk_and_health_mapping_remain_explicitly_unproven():
    qc = inspect()["qc"]
    assert qc["research_result"] == "CROSSWALK NOT PROVEN"
    assert not qc["health"]["local_export_present"]
    assert not qc["health"]["ward_id_compatibility_tested"]
