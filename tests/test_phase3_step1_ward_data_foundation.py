import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parents[1] / "scripts"))
from phase3_step1_ward_data_foundation import ROOT, preflight


def test_existing_era5_mapping_has_complete_relational_ward_coverage():
    result = preflight(ROOT)
    mapping = result["inputs"]["era5_mapping"]
    assert mapping["count"] == 200
    assert mapping["unique_ids"] == 200
    assert mapping["duplicate_ids"] == 0
    assert mapping["missing_grid_assignments"] == 0
    # Five valid ERA5-Land grids exist in the weather archive; current ward
    # centroids may legitimately use a subset of those grids.
    assert 1 <= mapping["grid_count"] <= 5


def test_preflight_blocks_unsafe_census_join_and_missing_health_source():
    result = preflight(ROOT)
    assert result["status"] == "BLOCKED"
    assert result["inputs"]["census_2011"]["ward_count"] == 155
    assert result["inputs"]["official_gcc_2025_present"]
    assert not result["inputs"]["health"]["directory_present"]
    assert len(result["blocking_issues"]) >= 2


def test_preflight_records_official_source_provenance():
    result = preflight(ROOT)
    sources = result["official_sources"]
    assert "chennaicorporation.gov.in" in sources["gcc_2025"]
    assert "censusindia.gov.in" in sources["census_pca_tv_2011"]
    assert "data.gov.in" in sources["health_infrastructure"]
