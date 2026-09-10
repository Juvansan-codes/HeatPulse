import sys
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import mean_absolute_error, mean_squared_error, f1_score
from scipy.stats import pearsonr

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
sys.path.insert(0, str(Path(__file__).parents[1] / "backend" / "app" / "thermal"))

from phase2_step2_tmrt import compute_tmrt
from phase2_step3_wbgt import compute_wbgt_outdoor
from phase2_step4_utci import compute_utci
from phase2_step6_htsi import compute_htsi
from heat_index import calculate_heat_index

ROOT = Path(__file__).parents[1]
CALIBRATED_PATH = ROOT / "data/processed/weather/forecast_calibrated_2024_2025.parquet"
TRUTH_PATH = ROOT / "data/processed/weather/forecast_truth_2024_2025.parquet"
WARD_MAPPING = ROOT / "data/processed/gis/spatial_ward_mapping.csv"
VULNERABILITY = ROOT / "data/processed/risk/ward_vulnerability_200.csv"
EXPOSURE = ROOT / "data/processed/gis/ward_exposure_200.csv"

OUT_FORECAST = ROOT / "data/processed/weather/forecast_operational_2024_2025.parquet"
OUT_RISK = ROOT / "data/processed/risk/forecast_ward_heat_risk_2024_2025.parquet"
OUT_ALERTS = ROOT / "data/processed/risk/forecast_alerts_2024_2025.parquet"
MD_REPORT = ROOT / "docs/phase4_step4_operational_forecast.md"

def get_metrics(y_true, y_pred):
    mask = ~np.isnan(y_true) & ~np.isnan(y_pred)
    yt, yp = y_true[mask], y_pred[mask]
    if len(yt) == 0: return np.nan, np.nan, np.nan
    return mean_absolute_error(yt, yp), np.sqrt(mean_squared_error(yt, yp)), np.mean(yp - yt)

def main():
    print("1. Loading datasets...")
    df_fcst = pd.read_parquet(CALIBRATED_PATH)
    df_truth = pd.read_parquet(TRUTH_PATH)
    
    df_fcst['timestamp'] = pd.to_datetime(df_fcst['valid_time'], utc=True)
    df_fcst['initialization_time'] = pd.to_datetime(df_fcst['initialization_time'], utc=True)
    df_truth['timestamp'] = pd.to_datetime(df_truth['timestamp'], utc=True)
    
    # 2. Variable Combination (Step 4 Audit approved: XGB for Temp, RH, Wind; Mean Bias for Rad)
    print("2. Combining operational variables...")
    df_fcst["temperature_2m"] = df_fcst["xgb_t2m"]
    df_fcst["relative_humidity"] = df_fcst["xgb_rh"]
    df_fcst["wind_speed_10m"] = df_fcst["xgb_wind"]
    df_fcst["solar_radiation"] = df_fcst["mean_bias_rad"]
    df_fcst["surface_pressure"] = df_fcst["truth_sp"]
    
    # Truth already contains standard variables: temperature_2m, relative_humidity, wind_speed_10m, solar_radiation, surface_pressure, utci, wbgt_outdoor
    
    # 3. Thermal Engine for Forecast
    print("3. Running thermal engine for operational forecast...")
    t = df_fcst["temperature_2m"]
    rh = df_fcst["relative_humidity"]
    alpha = np.log(np.maximum(rh, 1) / 100.0) + (17.625 * t) / (243.04 + t)
    df_fcst["dew_point_2m"] = (243.04 * alpha) / (17.625 - alpha)
    
    df_fcst = compute_tmrt(df_fcst)
    df_fcst = compute_wbgt_outdoor(df_fcst)
    df_fcst = compute_utci(df_fcst)
    df_fcst['heat_index'] = calculate_heat_index(df_fcst['temperature_2m'].values, df_fcst['relative_humidity'].values)
    
    # 4. Leakage-Safe Operational HTSI Sequence
    print("4. Constructing leakage-safe persistence boundaries and generating HTSI...")
    init_times = df_fcst['initialization_time'].unique()
    
    cols = ["timestamp", "grid_id", "latitude", "longitude", "utci", "wbgt_outdoor", "temperature_2m", "relative_humidity"]
    
    df_truth_sub = df_truth[cols].copy()
    
    results = []
    # Loop over initialization times to ensure perfect simulation of operational boundary
    # This might take ~2 minutes. To speed up, we can group.
    # Since we are guaranteed to run it as if in production:
    print(f"Processing {len(init_times)} unique forecast initializations...")
    
    # Batch processing: For each init_time, we get exactly the 5-day forecast.
    for i, itime in enumerate(init_times):
        if i % 1000 == 0:
            print(f"  ... {i}/{len(init_times)}")
            
        fcst_subset = df_fcst[df_fcst['initialization_time'] == itime].copy()
        
        # History: STRICTLY before initialization time
        hist_subset = df_truth_sub[(df_truth_sub['timestamp'] < itime) & (df_truth_sub['timestamp'] >= itime - pd.Timedelta(hours=72))].copy()
        
        timeline = pd.concat([hist_subset, fcst_subset[cols]], ignore_index=True)
        htsi_res, _ = compute_htsi(timeline)
        
        # Extract only the forecast portion
        htsi_fcst = htsi_res[htsi_res['timestamp'] >= itime].copy()
        htsi_fcst['initialization_time'] = itime
        results.append(htsi_fcst)
        
    print("Concatenating HTSI results...")
    htsi_final = pd.concat(results, ignore_index=True)
    
    # Merge HTSI back to forecast
    df_fcst = df_fcst.merge(htsi_final[["timestamp", "grid_id", "initialization_time", "htsi", "htsi_level", "htsi_label", "burden_24h", "burden_72h", "nighttime_stress", "thermal_hazard_score"]], 
                            on=["timestamp", "grid_id", "initialization_time"], how="left")
                            
    # 5. Ward Mapping and Risk
    print("5. Ward Mapping & Human Heat Risk...")
    mapping = pd.read_csv(WARD_MAPPING)
    vuln = pd.read_csv(VULNERABILITY)
    exp = pd.read_csv(EXPOSURE)
    
    # Ensure minmax normalization for exposure (same as Phase 3)
    def minmax(values):
        low, high = float(values.min()), float(values.max())
        if high == low: return pd.Series(0.0, index=values.index)
        return (values - low) / (high - low)
    exp['exposure_population_density'] = minmax(exp['population_density'])
    
    # Merge mapping
    df_fcst['join_lat'] = df_fcst['latitude'].round(6)
    df_fcst['join_lon'] = df_fcst['longitude'].round(6)
    mapping['join_lat'] = mapping['grid_lat'].round(6)
    mapping['join_lon'] = mapping['grid_lon'].round(6)
    
    ward_forecast = mapping.merge(df_fcst, on=["join_lat", "join_lon"], how="left")
    ward_forecast = ward_forecast.merge(vuln[["ward_id", "vulnerability"]], on="ward_id", how="left")
    ward_forecast = ward_forecast.merge(exp[["ward_id", "population_density", "exposure_population_density"]], on="ward_id", how="left")
    
    ward_forecast["heat_hazard"] = (ward_forecast["htsi"] / 100).clip(0, 1)
    # Frozen Phase 3 Risk Formula
    ward_forecast["human_heat_risk"] = ward_forecast["heat_hazard"] * ward_forecast["exposure_population_density"] * (0.5 + 0.5 * ward_forecast["vulnerability"])
    ward_forecast["extreme_utci_flag"] = ward_forecast["utci"] >= 46
    
    # Add operational confidence 
    ward_forecast["confidence"] = "not probabilistically calibrated"
    ward_forecast["provenance"] = "Open-Meteo (ECMWF+GFS) | XGB+MeanBias | HeatPulse 1.0"
    
    # 6. Alerts & Deduplication
    print("6. Alert Deduplication...")
    alert_mask = (ward_forecast["htsi_level"] >= 3) | ward_forecast["extreme_utci_flag"]
    alerts_raw = ward_forecast[alert_mask].copy()
    
    # Event grouping: Same ward, continuous time, same initialization time
    alerts_raw = alerts_raw.sort_values(["ward_id", "initialization_time", "timestamp"])
    
    if not alerts_raw.empty:
        ward_changed = alerts_raw['ward_id'] != alerts_raw['ward_id'].shift()
        init_changed = alerts_raw['initialization_time'] != alerts_raw['initialization_time'].shift()
        time_diff = alerts_raw['timestamp'].diff() > pd.Timedelta(hours=1)
        
        alerts_raw['event_id'] = (ward_changed | init_changed | time_diff).cumsum()
        
        df_events = alerts_raw.groupby('event_id').agg(
            ward_id=('ward_id', 'first'),
            initialization_time=('initialization_time', 'first'),
            start_time=('timestamp', 'min'),
            end_time=('timestamp', 'max'),
            peak_htsi=('htsi', 'max'),
            peak_utci=('utci', 'max'),
            maximum_alert_level=('htsi_level', 'max'),
            peak_risk=('human_heat_risk', 'max'),
            extreme_utci_flag=('extreme_utci_flag', 'max')
        ).reset_index(drop=True)
        
        idx_max_htsi = alerts_raw.groupby('event_id')['htsi'].idxmax()
        df_events['peak_time'] = alerts_raw.loc[idx_max_htsi, 'timestamp'].values
    else:
        df_events = pd.DataFrame(columns=[
            "ward_id", "initialization_time", "start_time", "end_time", "peak_time", 
            "peak_htsi", "peak_utci", "maximum_alert_level", "peak_risk", "extreme_utci_flag"
        ])
    
    # 7. Validation & Spatial Metrics
    print("7. End-to-end Validation on 2025 Test Set...")
    test_wards = ward_forecast[ward_forecast['split'] == 'test']
    
    lines = ["# Phase 4 Step 4: Operational Forecast Validation Report\n"]
    lines.append("## 1. End-to-End Metric Validation (Test Set 2025)\n")
    lines.append("| Metric | Day | MAE | RMSE | Bias |")
    lines.append("|--------|-----|-----|------|------|")
    
    # We must join with truth to get truth_htsi etc. 
    # The truth dataset contains truth_htsi, truth_tmrt etc.
    df_truth_val = df_truth.copy()
    df_truth_val['join_lat'] = df_truth_val['latitude'].round(6)
    df_truth_val['join_lon'] = df_truth_val['longitude'].round(6)
    ward_truth = mapping.merge(df_truth_val, on=["join_lat", "join_lon"], how="left")
    
    # Ensure truth has htsi (it should be in forecast_truth_2024_2025.parquet)
    # Actually TRUTH_PATH contains `mean_radiant_temp`, `utci`, `htsi`, `htsi_level`
    truth_cols = ["timestamp", "ward_id", "utci", "mean_radiant_temp", "wbgt_outdoor", "htsi", "htsi_level"]
    truth_rename = {c: f"truth_{c}" for c in truth_cols if c not in ["timestamp", "ward_id"]}
    ward_truth = ward_truth[truth_cols].rename(columns=truth_rename)
    
    val_merged = test_wards.merge(ward_truth, on=["timestamp", "ward_id"], how="inner")
    
    for day in sorted(val_merged['lead_day'].unique()):
        day_sub = val_merged[val_merged['lead_day'] == day]
        for name, pred, true in [("Tmrt", "mean_radiant_temp", "truth_mean_radiant_temp"),
                                 ("WBGT", "wbgt_outdoor", "truth_wbgt_outdoor"),
                                 ("UTCI", "utci", "truth_utci"),
                                 ("HTSI", "htsi", "truth_htsi")]:
            if true in day_sub.columns:
                mae, rmse, bias = get_metrics(day_sub[true], day_sub[pred])
                lines.append(f"| {name} | {day} | {mae:.2f} | {rmse:.2f} | {bias:.2f} |")
                
    lines.append("\n## 2. Spatial Validation\n")
    unique_htsi = val_merged['htsi'].nunique()
    unique_risk = val_merged['human_heat_risk'].nunique()
    lines.append(f"- **Unique HTSI values**: {unique_htsi} (Driven by 5 grids)")
    lines.append(f"- **Unique Human Heat Risk values**: {unique_risk} (Driven by 200 wards × exposure × vulnerability)")
    if unique_risk > unique_htsi:
        lines.append("- **Conclusion**: Spatial differentiation is strictly preserved across wards despite shared meteorological grids.")
        
    lines.append("\n## 3. Operational Alerts\n")
    lines.append(f"- **Total 2025 Alert Events (Deduplicated)**: {len(df_events[df_events['initialization_time'].dt.year == 2025]) if not df_events.empty else 0}")
    
    with open(MD_REPORT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
        
    print("8. Saving outputs...")
    OUT_FORECAST.parent.mkdir(exist_ok=True, parents=True)
    OUT_RISK.parent.mkdir(exist_ok=True, parents=True)
    
    df_fcst.to_parquet(OUT_FORECAST, index=False)
    ward_forecast.to_parquet(OUT_RISK, index=False)
    df_events.to_parquet(OUT_ALERTS, index=False)
    print("Pipeline complete!")

if __name__ == "__main__":
    main()
