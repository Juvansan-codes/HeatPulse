"""Phase 2 Step 6: project-specific Human Thermal Stress Index (HTSI).

This module reads Step 4 as a source and writes a new grid-level fact table.
It intentionally does not rewrite any validated Tmrt, WBGT, or UTCI output.
"""
from __future__ import annotations

import json
from pathlib import Path
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parents[1] / "backend" / "app" / "thermal"))
from heat_index import calculate_heat_index

SOURCE = Path("data/processed/weather/thermal_step4_utci_2014_2023.parquet")
OUTPUT = Path("data/processed/weather/htsi_2014_2023.parquet")
REPORT = Path("data/validation/weather/phase2_step6_htsi_report.json")
SENSITIVITY = Path("data/validation/weather/phase2_step6_htsi_sensitivity.csv")
IST = "Asia/Kolkata"
PERCENTILE_ANCHORS = np.array([50.0, 90.0, 95.0, 97.5, 99.0])
SCORE_ANCHORS = np.array([0.0, 50.0, 70.0, 85.0, 100.0])


def utci_stress_score(utci: pd.Series | np.ndarray) -> np.ndarray:
    """Piecewise UTCI score: 26/32/38/46 C map to 20/40/60/80.

    The project operational cap rule is linear 46--56 C -> 80--100, followed
    by clamping. It is a bounded scoring convention, not a medical threshold.
    """
    return np.clip(np.interp(np.asarray(utci, dtype=float), [-100, 26, 32, 38, 46, 56], [0, 20, 40, 60, 80, 100]), 0, 100)


def anomaly_score(percentile: pd.Series | np.ndarray) -> np.ndarray:
    """Project-local percentile anchors for WBGT and nighttime temperature."""
    return np.clip(np.interp(np.asarray(percentile, dtype=float), PERCENTILE_ANCHORS, SCORE_ANCHORS), 0, 100)


def local_percentile(values: pd.Series, groups: pd.Series) -> pd.Series:
    """Inclusive empirical percentile within the historical population per grid."""
    return values.groupby(groups, sort=False).rank(method="average", pct=True).mul(100)


def _grid_id(frame: pd.DataFrame) -> pd.Series:
    return frame["latitude"].map("{:.6f}".format) + "," + frame["longitude"].map("{:.6f}".format)


def nighttime_mask(timestamps: pd.Series) -> np.ndarray:
    """Return the 22:00--06:00 IST mask for UTC or naive UTC timestamps."""
    utc = pd.to_datetime(timestamps, utc=True)
    hours = utc.dt.tz_convert(IST).dt.hour
    return ((hours >= 22) | (hours < 6)).to_numpy()


def _levels(scores: pd.Series, boundaries: list[float]) -> tuple[np.ndarray, np.ndarray]:
    codes = np.searchsorted(np.asarray(boundaries), scores.to_numpy(), side="right") + 1
    codes = np.clip(codes, 1, 5)
    labels = np.array(["Normal", "Moderate", "High", "Very High", "Extreme"])[codes - 1]
    return codes, labels


def compute_htsi(source: pd.DataFrame, hazard_weights: tuple[float, float] = (0.80, 0.20),
                 persistence_weights: tuple[float, float, float] = (0.50, 0.30, 0.20),
                 level_boundaries: list[float] | None = None) -> tuple[pd.DataFrame, list[float]]:
    """Compute HTSI using only records at or before each timestamp per grid."""
    required = {"timestamp", "latitude", "longitude", "utci", "wbgt_outdoor", "temperature_2m", "relative_humidity"}
    missing = required.difference(source.columns)
    if missing:
        raise ValueError(f"Missing required HTSI input columns: {sorted(missing)}")
    if source[list(required)].isna().any().any():
        raise ValueError("HTSI inputs contain missing values; refusing to create invalid scores")
    work = source.sort_values(["latitude", "longitude", "timestamp"]).copy()
    work["grid_id"] = _grid_id(work)
    work["utci_score"] = utci_stress_score(work["utci"])
    work["wbgt_percentile"] = local_percentile(work["wbgt_outdoor"], work["grid_id"])
    work["wbgt_score"] = anomaly_score(work["wbgt_percentile"])
    work["heat_index"] = calculate_heat_index(work["temperature_2m"].to_numpy(), work["relative_humidity"].to_numpy())
    work["thermal_hazard_score"] = hazard_weights[0] * work["utci_score"] + hazard_weights[1] * work["wbgt_score"]
    excess = (work["utci_score"] - 20).clip(lower=0)
    # min_periods=1 deliberately means early history uses only available current/past hours.
    work["burden_24h"] = excess.groupby(work["grid_id"], sort=False).transform(lambda s: s.rolling(24, min_periods=1).mean() / 80 * 100)
    work["burden_72h"] = excess.groupby(work["grid_id"], sort=False).transform(lambda s: s.rolling(72, min_periods=1).mean() / 80 * 100)
    night = nighttime_mask(work["timestamp"])
    work["is_night_ist"] = night
    work["nighttime_temp_percentile"] = np.nan
    work.loc[night, "nighttime_temp_percentile"] = local_percentile(work.loc[night, "temperature_2m"], work.loc[night, "grid_id"])
    work["nighttime_stress"] = 0.0
    work.loc[night, "nighttime_stress"] = anomaly_score(work.loc[night, "nighttime_temp_percentile"])
    p = persistence_weights[0] * work["burden_24h"] + persistence_weights[1] * work["burden_72h"] + persistence_weights[2] * work["nighttime_stress"]
    work["htsi"] = np.clip(0.80 * work["thermal_hazard_score"] + 0.20 * p, 0, 100)
    if level_boundaries is None:
        # Historical, grid-level calibration: P50/P75/P90/P97.5 split five operational levels.
        level_boundaries = [float(work["htsi"].quantile(q)) for q in (0.50, 0.75, 0.90, 0.975)]
    work["htsi_level"], work["htsi_label"] = _levels(work["htsi"], level_boundaries)
    work["extreme_thermal_event"] = work["utci"] >= 46
    work["data_quality"] = "derived_from_complete_step4_grid_record"
    keep = ["timestamp", "grid_id", "latitude", "longitude", "utci", "utci_score", "wbgt_outdoor", "wbgt_percentile", "wbgt_score", "heat_index", "burden_24h", "burden_72h", "is_night_ist", "nighttime_temp_percentile", "nighttime_stress", "thermal_hazard_score", "htsi", "htsi_level", "htsi_label", "extreme_thermal_event", "data_quality"]
    return work[keep], level_boundaries


def sensitivity_analysis(source: pd.DataFrame, baseline: pd.DataFrame, boundaries: list[float]) -> pd.DataFrame:
    variants = {"70_30__50_30_20": ((.70, .30), (.50, .30, .20)), "80_20__55_25_20": ((.80, .20), (.55, .25, .20)), "80_20__45_35_20": ((.80, .20), (.45, .35, .20)), "90_10__50_30_20": ((.90, .10), (.50, .30, .20))}
    rows = []
    for name, (hazard, persistence) in variants.items():
        out, _ = compute_htsi(source, hazard, persistence, boundaries)
        changed = out["htsi_level"].to_numpy() != baseline["htsi_level"].to_numpy()
        rows.append({"variant": name, "pearson_correlation": out["htsi"].corr(baseline["htsi"]), "level_change_percent": changed.mean() * 100, "extreme_event_category_changes": int((changed & baseline["extreme_thermal_event"].to_numpy()).sum()), **{f"level_{level}_count": int((out["htsi_level"] == level).sum()) for level in range(1, 6)}})
    return pd.DataFrame(rows)


def report(frame: pd.DataFrame, boundaries: list[float]) -> dict:
    local = pd.to_datetime(frame["timestamp"], utc=True).dt.tz_convert(IST)
    top = frame.nlargest(20, "htsi")[["timestamp", "grid_id", "utci", "wbgt_outdoor", "heat_index", "burden_24h", "burden_72h", "nighttime_stress", "htsi", "htsi_label"]].copy()
    top["timestamp"] = top["timestamp"].astype(str)
    top[["utci", "wbgt_outdoor", "heat_index", "burden_24h", "burden_72h", "nighttime_stress", "htsi"]] = top[["utci", "wbgt_outdoor", "heat_index", "burden_24h", "burden_72h", "nighttime_stress", "htsi"]].round(3)
    return {"rows": len(frame), "grids": int(frame["grid_id"].nunique()), "htsi_summary": frame["htsi"].describe(percentiles=[.01, .05, .25, .5, .75, .9, .95, .975, .99]).round(4).to_dict(), "level_boundaries": boundaries, "level_counts": frame["htsi_label"].value_counts().to_dict(), "extreme_utci_events": int(frame["extreme_thermal_event"].sum()), "monthly_mean_htsi": frame.groupby(local.dt.month)["htsi"].mean().round(3).to_dict(), "ist_hour_mean_htsi": frame.groupby(local.dt.hour)["htsi"].mean().round(3).to_dict(), "grid_mean_htsi": frame.groupby("grid_id")["htsi"].mean().round(3).to_dict(), "top_20": top.to_dict(orient="records")}


def main() -> None:
    source = pd.read_parquet(SOURCE)
    output, boundaries = compute_htsi(source)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    output.to_parquet(OUTPUT, index=False)
    sensitivity = sensitivity_analysis(source, output, boundaries)
    SENSITIVITY.parent.mkdir(parents=True, exist_ok=True)
    sensitivity.to_csv(SENSITIVITY, index=False)
    REPORT.write_text(json.dumps(report(output, boundaries), indent=2, default=str), encoding="utf-8")
    print(f"Wrote {len(output):,} HTSI grid rows to {OUTPUT}")


if __name__ == "__main__":
    main()
