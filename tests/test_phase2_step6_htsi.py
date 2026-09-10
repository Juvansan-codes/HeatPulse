import numpy as np
import pandas as pd
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parents[1] / "scripts"))
from phase2_step6_htsi import anomaly_score, compute_htsi, nighttime_mask, utci_stress_score


def source(rows=96):
    stamps = pd.date_range("2020-01-01", periods=rows, freq="h")
    return pd.DataFrame({"timestamp": stamps, "latitude": 13.0, "longitude": 80.0, "utci": np.linspace(20, 46, rows), "wbgt_outdoor": np.linspace(22, 34, rows), "temperature_2m": np.linspace(25, 35, rows), "relative_humidity": 65.0})


def test_utci_boundaries_and_monotonicity():
    assert np.allclose(utci_stress_score([26, 32, 38, 46]), [20, 40, 60, 80])
    assert np.all(np.diff(utci_stress_score(np.linspace(10, 60, 100))) >= 0)


def test_percentile_anchors_and_monotonicity():
    assert np.allclose(anomaly_score([50, 90, 95, 97.5, 99]), [0, 50, 70, 85, 100])
    assert np.all(np.diff(anomaly_score(np.linspace(40, 100, 100))) >= 0)


def test_range_extreme_heat_index_and_reproducibility():
    out1, bounds = compute_htsi(source())
    out2, _ = compute_htsi(source(), level_boundaries=bounds)
    assert out1.htsi.between(0, 100).all()
    assert out1.heat_index.notna().all()
    assert out1.extreme_thermal_event.iloc[-1]
    assert not out1.extreme_thermal_event.iloc[-2]
    assert out1.equals(out2)


def test_burden_is_past_only_and_increases_with_sustained_stress():
    frame = source(80)
    frame.loc[:39, "utci"] = 26
    frame.loc[40:, "utci"] = 40
    out, _ = compute_htsi(frame)
    assert out.burden_24h.iloc[63] > out.burden_24h.iloc[40]
    altered = frame.copy(); altered.loc[70:, "utci"] = 46
    alternate, _ = compute_htsi(altered)
    assert np.allclose(out.htsi.iloc[:70], alternate.htsi.iloc[:70])


def test_ist_night_and_missing_input_rejected():
    # 16:30 UTC = 22:00 IST; 00:30 UTC = 06:00 IST (not night).
    assert nighttime_mask(pd.Series(pd.to_datetime(["2020-01-01 16:30", "2020-01-01 00:30"]))).tolist() == [True, False]
    bad = source(); bad.loc[0, "utci"] = np.nan
    try:
        compute_htsi(bad)
    except ValueError:
        pass
    else:
        raise AssertionError("missing input must be rejected")


def test_grid_level_rows_are_not_ward_expanded():
    frame = pd.concat([source(24), source(24).assign(latitude=13.1)], ignore_index=True)
    out, _ = compute_htsi(frame)
    assert len(out) == 48 and out.grid_id.nunique() == 2
