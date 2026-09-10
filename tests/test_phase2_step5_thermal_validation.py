import hashlib
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
from phase2_step5_thermal_validation import (  # noqa: E402
    controlled_physics,
    load_source,
    representative_conditions,
    temporal_and_spatial,
    top_utci,
    validate_integrity,
)


def test_source_integrity_and_no_ward_expansion():
    frame = load_source()
    result = validate_integrity(frame)
    assert result["row_count_ok"]
    assert result["grid_count_ok"]
    assert result["unique_timestamp_grid_ok"]
    assert result["timestamp_continuity_ok"]
    assert not result["ward_expansion_detected"]
    assert all(count == 0 for count in result["nan_counts"].values())
    assert result["numeric_ranges"]["relative_humidity_valid"]
    assert result["numeric_ranges"]["wind_nonnegative"]
    assert result["numeric_ranges"]["raw_ghi_negative_count"] >= 0


def test_source_is_not_modified():
    path = Path("data/processed/weather/thermal_step4_utci_2014_2023.parquet")
    before = hashlib.sha256(path.read_bytes()).digest()
    frame = load_source()
    _ = validate_integrity(frame)
    after = hashlib.sha256(path.read_bytes()).digest()
    assert before == after


def test_controlled_physics_responses():
    expected = controlled_physics()["expected_direction"]
    assert all(bool(value) for value in expected.values())


def test_outputs_are_deterministic_and_structured():
    frame = load_source()
    first = representative_conditions(frame)
    second = representative_conditions(frame)
    pd.testing.assert_frame_equal(first, second)
    assert len(first) == 6
    assert set(first["condition"]) == {"normal daytime", "hot/humid daytime", "hot/dry/high-radiation daytime", "hot/low-wind/high-radiation event", "cool/nighttime", "high-wind case"}
    assert len(top_utci(frame)) == 20


def test_temporal_and_spatial_summaries():
    (hourly, monthly), spatial = temporal_and_spatial(load_source())
    assert len(hourly) == 24
    assert len(monthly) == 12
    assert len(spatial) == 5
    assert np.isfinite(hourly.to_numpy()).all()
