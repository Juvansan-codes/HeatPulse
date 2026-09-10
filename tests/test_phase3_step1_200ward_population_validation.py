import json
from pathlib import Path
import sys

import pandas as pd

sys.path.append(str(Path(__file__).parents[1] / "scripts"))
from phase3_step1_200ward_population_validation import OUT, SUMMARY, validate


def test_qc_source_schedule_is_complete_and_has_no_duplicate_or_missing_ids():
    qc = pd.read_csv(OUT)
    assert len(qc) == qc.ward.nunique() == 200
    assert set(qc.ward) == set(range(1, 201))
    assert not qc.duplicate_flag.any()
    assert not qc.missing_flag.any()


def test_source_values_and_current_geometry_identifier_check_are_valid():
    qc = pd.read_csv(OUT)
    assert (qc.source_population_2011 >= 0).all()
    assert (qc.source_households_2011 >= 0).all()
    assert qc.geometry_match.all()
    assert qc.source_vintage.eq("Census 2011, GCC draft delimitation proposal").all()


def test_draft_source_is_not_mislabeled_as_final_or_production():
    summary = json.loads(SUMMARY.read_text(encoding="utf-8"))
    qc = pd.read_csv(OUT)
    assert summary["conclusion"] == "NO AUTHORITATIVE CURRENT-200-WARD DATA FOUND"
    assert "Do not merge" in summary["production_decision"]
    assert qc.validation_status.eq("DRAFT_ID_MATCH_GEOGRAPHICALLY_INCOMPATIBLE").all()
