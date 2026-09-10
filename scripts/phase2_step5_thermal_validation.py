"""Phase 2 Step 5: cross-validate independent thermal pathways.

This module reads the validated Step 4 parquet only. It does not recompute,
rewrite, or expand the upstream thermal datasets.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parents[1] / "backend" / "app" / "thermal"))
from heat_index import calculate_heat_index

SOURCE_COLUMNS = {
    "timestamp", "latitude", "longitude", "temperature_2m", "relative_humidity",
    "wind_speed_10m", "solar_radiation", "mean_radiant_temp", "wbgt_outdoor", "utci",
}
METRIC_COLUMNS = ["temperature_2m", "relative_humidity", "mean_radiant_temp", "heat_index", "wbgt_outdoor", "utci"]
REQUIRED_ROWS = 438_240
REQUIRED_GRIDS = 5


def source_path(root: str | Path = ".") -> Path:
    return Path(root) / "data" / "processed" / "weather" / "thermal_step4_utci_2014_2023.parquet"


def load_source(root: str | Path = ".") -> pd.DataFrame:
    """Load Step 4 and add the independent NOAA Heat Index diagnostic."""
    frame = pd.read_parquet(source_path(root))
    missing = SOURCE_COLUMNS.difference(frame.columns)
    if missing:
        raise ValueError(f"Step 4 source is missing required columns: {sorted(missing)}")
    result = frame.copy(deep=True)
    result["heat_index"] = calculate_heat_index(
        result["temperature_2m"].to_numpy(), result["relative_humidity"].to_numpy()
    )
    return result


def _grid_key(frame: pd.DataFrame) -> pd.Series:
    return frame["latitude"].round(6).astype(str) + "," + frame["longitude"].round(6).astype(str)


def validate_integrity(frame: pd.DataFrame) -> dict[str, Any]:
    """Return falsifiable integrity checks without changing the frame."""
    keys = _grid_key(frame)
    pair_index = pd.MultiIndex.from_arrays([frame["timestamp"], keys])
    sorted_frame = frame.sort_values(["latitude", "longitude", "timestamp"])
    expected_hours = pd.date_range("2014-01-01", "2023-12-31 23:00", freq="h")
    continuity = True
    per_grid_rows: dict[str, int] = {}
    for grid, group in sorted_frame.groupby(["latitude", "longitude"], sort=True):
        stamps = pd.DatetimeIndex(group["timestamp"])
        per_grid_rows[f"{grid[0]:.6f},{grid[1]:.6f}"] = len(group)
        continuity = continuity and stamps.equals(expected_hours)
    nan_counts = {column: int(frame[column].isna().sum()) for column in METRIC_COLUMNS if column in frame}
    numeric_ranges = {
        "relative_humidity_valid": bool(frame["relative_humidity"].between(0, 100).all()),
        "wind_nonnegative": bool((frame["wind_speed_10m"] >= 0).all()),
        "raw_ghi_nonnegative": bool((frame["solar_radiation"] >= 0).all()),
        "raw_ghi_negative_count": int((frame["solar_radiation"] < 0).sum()),
    }
    return {
        "rows": len(frame),
        "expected_rows": REQUIRED_ROWS,
        "row_count_ok": len(frame) == REQUIRED_ROWS,
        "grid_count": int(keys.nunique()),
        "grid_count_ok": int(keys.nunique()) == REQUIRED_GRIDS,
        "duplicate_timestamp_grid": int(pair_index.duplicated().sum()),
        "unique_timestamp_grid_ok": not pair_index.duplicated().any(),
        "ward_expansion_detected": bool(keys.nunique() > REQUIRED_GRIDS or len(frame) != REQUIRED_ROWS),
        "timestamp_continuity_ok": continuity,
        "per_grid_rows": per_grid_rows,
        "nan_counts": nan_counts,
        "numeric_ranges": numeric_ranges,
    }


def _select(frame: pd.DataFrame, score: pd.Series) -> pd.Series:
    return frame.loc[score.replace([np.inf, -np.inf], np.nan).idxmin()]


def representative_conditions(frame: pd.DataFrame) -> pd.DataFrame:
    """Select deterministic examples; conditions are descriptive, not categories."""
    day = frame["solar_radiation"] > 50
    high_ta = frame["temperature_2m"].rank(pct=True)
    high_ghi = frame["solar_radiation"].rank(pct=True)
    low_rh = 1 - frame["relative_humidity"].rank(pct=True)
    high_rh = frame["relative_humidity"].rank(pct=True)
    low_wind = 1 - frame["wind_speed_10m"].rank(pct=True)
    high_wind = frame["wind_speed_10m"].rank(pct=True)
    low_ta = 1 - frame["temperature_2m"].rank(pct=True)
    candidates = {
        "normal daytime": ((frame["temperature_2m"] - 29).abs() + (frame["relative_humidity"] - 65).abs() / 10 + (frame["solar_radiation"] - 500).abs() / 250).where(day, np.inf),
        "hot/humid daytime": (2 - high_ta - high_rh).where(day, np.inf),
        "hot/dry/high-radiation daytime": (2 - high_ta - low_rh - high_ghi).where(day, np.inf),
        "hot/low-wind/high-radiation event": (3 - high_ta - low_wind - high_ghi).where(day, np.inf),
        "cool/nighttime": (2 - low_ta).where(~day, np.inf),
        "high-wind case": (1 - high_wind).where(day, np.inf),
    }
    rows = []
    for condition, score in candidates.items():
        selected = _select(frame, score)
        rows.append({
            "condition": condition,
            "timestamp": selected["timestamp"],
            "grid": f"{selected['latitude']:.6f},{selected['longitude']:.6f}",
            "Ta": selected["temperature_2m"], "RH": selected["relative_humidity"],
            "wind": selected["wind_speed_10m"], "GHI": selected["solar_radiation"],
            "Tmrt": selected["mean_radiant_temp"], "Heat Index": selected["heat_index"],
            "WBGT": selected["wbgt_outdoor"], "UTCI": selected["utci"],
        })
    return pd.DataFrame(rows)


def controlled_physics() -> dict[str, Any]:
    """Run one-variable-at-a-time checks through the existing implementations."""
    from phase2_step3_wbgt import compute_wbgt_outdoor
    from phase2_step4_utci import compute_utci

    def case(ta=35.0, rh=50.0, wind=2.0, tmrt=45.0, ghi=700.0):
        alpha = np.log(rh / 100) + 17.27 * ta / (237.3 + ta)
        dew = 237.3 * alpha / (17.27 - alpha)
        return pd.DataFrame({"timestamp": pd.to_datetime(["2020-05-15 06:00"]), "latitude": [13.0], "longitude": [80.0], "temperature_2m": [ta], "dew_point_2m": [dew], "mean_radiant_temp": [tmrt], "relative_humidity": [rh], "wind_speed_10m": [wind], "solar_radiation": [ghi], "surface_pressure": [101000.0]})

    def evaluate(frame):
        hi = float(calculate_heat_index(frame["temperature_2m"], frame["relative_humidity"])[0])
        wbgt = float(compute_wbgt_outdoor(frame)["wbgt_outdoor"].iloc[0])
        utci = float(compute_utci(frame)["utci"].iloc[0])
        return {"heat_index": hi, "wbgt": wbgt, "utci": utci}

    base = evaluate(case())
    checks = {
        "temperature": {"base": base, "hot": evaluate(case(ta=40.0))},
        "humidity": {"base": base, "humid": evaluate(case(rh=80.0))},
        "wind": {"base": base, "windy": evaluate(case(wind=10.0))},
        "tmrt": {"base": base, "radiant": evaluate(case(tmrt=65.0))},
        "ghi": {"base": base, "sunny": evaluate(case(ghi=950.0, tmrt=55.0))},
        "nighttime": {"base": evaluate(case(ghi=0.0, tmrt=25.0)), "zero_ghi": evaluate(case(ghi=0.0, tmrt=45.0))},
    }
    checks["expected_direction"] = {
        "temperature": checks["temperature"]["hot"]["heat_index"] > base["heat_index"] and checks["temperature"]["hot"]["wbgt"] > base["wbgt"] and checks["temperature"]["hot"]["utci"] > base["utci"],
        "humidity": checks["humidity"]["humid"]["heat_index"] > base["heat_index"] and checks["humidity"]["humid"]["wbgt"] > base["wbgt"] and checks["humidity"]["humid"]["utci"] > base["utci"],
        "wind": checks["wind"]["windy"]["wbgt"] < base["wbgt"] and checks["wind"]["windy"]["utci"] < base["utci"] and np.isclose(checks["wind"]["windy"]["heat_index"], base["heat_index"]),
        "tmrt": np.isclose(checks["tmrt"]["radiant"]["heat_index"], base["heat_index"]) and np.isclose(checks["tmrt"]["radiant"]["wbgt"], base["wbgt"]) and checks["tmrt"]["radiant"]["utci"] > base["utci"],
        "ghi": np.isclose(checks["ghi"]["sunny"]["heat_index"], base["heat_index"]) and checks["ghi"]["sunny"]["wbgt"] > base["wbgt"],
    }
    return checks


def correlations(frame: pd.DataFrame) -> dict[str, pd.DataFrame]:
    conditions = {"all": pd.Series(True, index=frame.index), "daytime": frame["solar_radiation"] > 50, "nighttime": frame["solar_radiation"] <= 50, "hot": frame["temperature_2m"] >= 32}
    return {name: pd.DataFrame({"pearson": frame.loc[mask, METRIC_COLUMNS].corr(method="pearson").round(4).stack(), "spearman": frame.loc[mask, METRIC_COLUMNS].corr(method="spearman").round(4).stack()}) for name, mask in conditions.items()}


def top_utci(frame: pd.DataFrame, count: int = 20) -> pd.DataFrame:
    columns = ["timestamp", "latitude", "longitude", "temperature_2m", "relative_humidity", "wind_speed_10m", "solar_radiation", "mean_radiant_temp", "heat_index", "wbgt_outdoor", "utci"]
    return frame.nlargest(count, "utci")[columns].rename(columns={"latitude": "grid_lat", "longitude": "grid_lon", "temperature_2m": "Ta", "relative_humidity": "RH", "wind_speed_10m": "wind", "solar_radiation": "GHI", "mean_radiant_temp": "Tmrt", "wbgt_outdoor": "WBGT", "utci": "UTCI"})


def temporal_and_spatial(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    work = frame.assign(hour=frame["timestamp"].dt.hour, month=frame["timestamp"].dt.month)
    hourly = work.groupby("hour")[METRIC_COLUMNS].mean().round(3)
    monthly = work.groupby("month")[METRIC_COLUMNS].mean().round(3)
    spatial = work.groupby(["latitude", "longitude"]).agg(
        temperature_2m_mean=("temperature_2m", "mean"),
        tmrt_mean=("mean_radiant_temp", "mean"),
        wbgt_mean=("wbgt_outdoor", "mean"),
        utci_mean=("utci", "mean"),
        utci_p95=("utci", lambda values: values.quantile(0.95)),
    ).round(3)
    return (hourly, monthly), spatial.reset_index()


def classification_reference() -> pd.DataFrame:
    return pd.DataFrame([
        {"index": "Heat Index", "source": "NOAA/NWS Heat Index", "threshold_or_category": "80-90 F (caution); 90-105 F (extreme caution); 105-130 F (danger); >=130 F (extreme danger)"},
        {"index": "WBGT", "source": "NIOSH Criteria for a Recommended Standard: Occupational Exposure to Heat and Hot Environments (2016), screening table", "threshold_or_category": "Work/rest screening thresholds depend on workload and acclimatization; no single universal health category"},
        {"index": "UTCI", "source": "UTCI operational categories, UTCI project / ISO 11079 context", "threshold_or_category": "26-32 moderate heat; 32-38 strong heat; 38-46 very strong heat; >46 extreme heat stress"},
    ])


if __name__ == "__main__":
    data = load_source()
    print(validate_integrity(data))
    print(representative_conditions(data).to_string(index=False))
    print(top_utci(data).to_string(index=False))
