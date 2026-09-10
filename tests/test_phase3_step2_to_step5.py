from __future__ import annotations

import hashlib
from pathlib import Path

import numpy as np
import pandas as pd

import sys

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
from phase3_step2_healthcare import build_healthcare, extract_facilities  # noqa: E402
from phase3_step3_green_capacity import assess_green_data  # noqa: E402
from phase3_step4_vulnerability import build_vulnerability  # noqa: E402
from phase3_step5_human_heat_risk import build_risk  # noqa: E402

ROOT = Path(__file__).parents[1]
HTSI_PATH = ROOT / "data/processed/weather/htsi_2014_2023.parquet"


def test_healthcare_has_exact_current_ward_mapping():
    output, report = build_healthcare()
    assert len(extract_facilities()) == 140
    assert len(output) == output.ward_id.nunique() == 200
    assert report["mapped_facility_records"] == 140
    assert (output.healthcare_facility_count >= 0).all()
    assert (output.healthcare_facilities_per_10000_derived_population >= 0).all()


def test_green_source_is_omitted_without_fabrication():
    report = assess_green_data()
    assert report["status"] == "OMITTED"
    assert report["green_variable"] is None
    assert report["source_vintage"] == 2016


def test_vulnerability_is_reduced_and_bounded():
    output, report = build_vulnerability()
    assert len(output) == output.ward_id.nunique() == 200
    assert report["formula"] == "V = 0.5*S + 0.5*(1-A)"
    assert output["population_density_sensitivity"].between(0, 1).all()
    assert output["healthcare_access_capacity"].between(0, 1).all()
    assert output["vulnerability"].between(0, 1).all()
    assert (output["population"] >= 0).all()


def test_risk_snapshot_preserves_htsi_and_ward_coverage():
    before = hashlib.sha256(HTSI_PATH.read_bytes()).digest()
    output, report = build_risk()
    after = hashlib.sha256(HTSI_PATH.read_bytes()).digest()
    assert before == after
    assert len(output) == output.ward_id.nunique() == 200
    assert report["selected_formula"] == "H x E x (0.5 + 0.5V)"
    assert output["htsi"].between(0, 100).all()
    assert output["human_heat_risk"].between(0, 1).all()
    assert output["human_heat_risk_formula_a"].between(0, 1).all()
    assert output["human_heat_risk_formula_b"].between(0, 1).all()
    assert output["population"] .ge(0).all()
    assert output["population_density"].ge(0).all()
    assert output["green_cooling_variable"].isna().all()
    assert output["slum_informal_settlement_variable"].isna().all()
    assert output["data_quality_confidence"].eq("LOW_TO_MEDIUM").all()


def test_risk_is_deterministic():
    first, _ = build_risk()
    second, _ = build_risk()
    pd.testing.assert_frame_equal(first, second)
