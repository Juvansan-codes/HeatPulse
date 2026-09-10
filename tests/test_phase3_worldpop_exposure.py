from pathlib import Path

import pandas as pd

P = Path(__file__).parents[1] / "data/processed/gis/ward_exposure_200.csv"
REQUIRED = {
    "ward_id", "zone_id", "zone", "area_km2", "population", "population_density",
    "population_source", "population_method", "population_vintage",
    "population_is_derived", "population_confidence",
}


def test_exposure_is_complete_and_explicitly_derived():
    d = pd.read_csv(P)
    assert REQUIRED <= set(d.columns)
    assert len(d) == d.ward_id.nunique() == 200
    assert set(d.ward_id) == set(range(1, 201))
    assert (d.population >= 0).all()
    assert (d.population_density >= 0).all()
    assert (d.area_km2 > 0).all()
    assert (d.population_density - d.population / d.area_km2).abs().max() < 1e-8
    assert d.population_is_derived.astype(bool).all()
    assert d.population_vintage.eq(2020).all()
    assert d[["population_source", "population_method", "population_confidence"]].notna().all().all()
