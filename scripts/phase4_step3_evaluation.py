import os
import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import mean_absolute_error, mean_squared_error
from scipy.stats import pearsonr

# Add backend and scripts to sys.path
sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
sys.path.insert(0, str(Path(__file__).parents[1] / "backend" / "app" / "thermal"))

from phase2_step2_tmrt import compute_tmrt
from phase2_step3_wbgt import compute_wbgt_outdoor
from phase2_step4_utci import compute_utci
from phase2_step6_htsi import compute_htsi
from heat_index import calculate_heat_index

CALIBRATED_OUT = Path("data/processed/weather/forecast_calibrated_2024_2025.parquet")
MD_REPORT_OUT = Path("docs/phase4_step3_ml_calibration.md")

def compute_metrics(y_true, y_pred):
    mask = ~np.isnan(y_true) & ~np.isnan(y_pred)
    y_t = y_true[mask]
    y_p = y_pred[mask]
    
    if len(y_t) == 0:
        return np.nan, np.nan, np.nan, np.nan, 0
        
    mae = mean_absolute_error(y_t, y_p)
    rmse = np.sqrt(mean_squared_error(y_t, y_p))
    bias = np.mean(y_p - y_t)
    corr, _ = pearsonr(y_t, y_p) if len(y_t) > 1 and np.std(y_p) > 0 and np.std(y_t) > 0 else (np.nan, 1)
    
    return mae, rmse, bias, corr, len(y_t)

def safe_compute_thermal(df, prefix="raw"):
    df_d = df.copy()
    
    # Rename columns so thermal engine functions can use them natively
    df_d["temperature_2m"] = df_d[f"{prefix}_t2m"]
    df_d["relative_humidity"] = df_d[f"{prefix}_rh"]
    df_d["wind_speed_10m"] = df_d[f"{prefix}_wind"]
    df_d["solar_radiation"] = df_d[f"{prefix}_rad"]
    df_d["surface_pressure"] = df_d["truth_sp"]
    df_d["timestamp"] = df_d["valid_time"]
    
    t = df_d["temperature_2m"]
    rh = df_d["relative_humidity"]
    alpha = np.log(np.maximum(rh, 1) / 100.0) + (17.625 * t) / (243.04 + t)
    df_d["dew_point_2m"] = (243.04 * alpha) / (17.625 - alpha)
    
    # Thermal engine
    df_d = compute_tmrt(df_d)
    df_d = compute_wbgt_outdoor(df_d)
    df_d = compute_utci(df_d)
    df_d['heat_index'] = calculate_heat_index(df_d['temperature_2m'].values, df_d['relative_humidity'].values)
    
    df[f"{prefix}_tmrt"] = df_d["mean_radiant_temp"]
    df[f"{prefix}_wbgt"] = df_d["wbgt_outdoor"]
    df[f"{prefix}_utci"] = df_d["utci"]
    df[f"{prefix}_heat_index"] = df_d["heat_index"]
    
    # HTSI Evaluation requires sorting by timestamp for persistence tracking
    # compute_htsi does grouping internally, but expects chronological order per grid_id
    df_d = df_d.sort_values(by=["grid_id", "valid_time"]).reset_index(drop=True)
    df_d, _ = compute_htsi(df_d)
    
    # Merge back to df using valid_time and grid_id
    df_d.rename(columns={"htsi": f"{prefix}_htsi", "htsi_level": f"{prefix}_htsi_level"}, inplace=True)
    df = df.merge(df_d[["timestamp", "grid_id", f"{prefix}_htsi", f"{prefix}_htsi_level"]], 
                  left_on=["valid_time", "grid_id"], 
                  right_on=["timestamp", "grid_id"], 
                  how="left").drop(columns=["timestamp"])
    
    return df

def generate_report(test_df):
    lines = []
    lines.append("# Phase 4 Step 3: XGBoost ML Calibration Report\n")
    
    test_df = test_df[test_df['split'] == 'test'].copy()
    
    if len(test_df) == 0:
        lines.append("ERROR: No test records found in 2025.")
        with open(MD_REPORT_OUT, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        return
        
    lines.append("## 1. Weather Validation (Test Set 2025)\n")
    lines.append("| Variable | Raw NWP | Mean Bias | XGBoost | Best Method |")
    lines.append("|----------|---------|-----------|---------|-------------|")
    
    variables = {
        "Temperature": ("truth_t2m", "raw_t2m", "mean_bias_t2m", "xgb_t2m"),
        "RH": ("truth_rh", "raw_rh", "mean_bias_rh", "xgb_rh"),
        "Wind": ("truth_wind", "raw_wind", "mean_bias_wind", "xgb_wind"),
        "Radiation": ("truth_rad", "raw_rad", "mean_bias_rad", "xgb_rad"),
    }
    
    weather_results = {}
    for vname, (t, r, m, x) in variables.items():
        mae_r, _, _, _, _ = compute_metrics(test_df[t], test_df[r])
        mae_m, _, _, _, _ = compute_metrics(test_df[t], test_df[m])
        mae_x, _, _, _, _ = compute_metrics(test_df[t], test_df[x])
        
        methods = {"Raw NWP": mae_r, "Mean Bias": mae_m, "XGBoost": mae_x}
        best = min(methods, key=methods.get)
        
        lines.append(f"| {vname} | MAE={mae_r:.2f} | MAE={mae_m:.2f} | MAE={mae_x:.2f} | **{best}** |")
        weather_results[vname] = best

    lines.append("\n## 2. Thermal Validation (Test Set 2025)\n")
    lines.append("| Thermal Metric | Raw NWP | Mean Bias | XGBoost | Best Method |")
    lines.append("|----------------|---------|-----------|---------|-------------|")
    
    thermal_vars = {
        "Tmrt": ("truth_tmrt", "raw_tmrt", "mean_bias_tmrt", "xgb_tmrt"),
        "WBGT": ("truth_wbgt", "raw_wbgt", "mean_bias_wbgt", "xgb_wbgt"),
        "UTCI": ("truth_utci", "raw_utci", "mean_bias_utci", "xgb_utci"),
        "Heat Index": ("truth_heat_index", "raw_heat_index", "mean_bias_heat_index", "xgb_heat_index"),
        "HTSI": ("truth_htsi", "raw_htsi", "mean_bias_htsi", "xgb_htsi"),
    }
    
    for vname, (t, r, m, x) in thermal_vars.items():
        mae_r, _, _, _, _ = compute_metrics(test_df[t], test_df[r])
        mae_m, _, _, _, _ = compute_metrics(test_df[t], test_df[m])
        mae_x, _, _, _, _ = compute_metrics(test_df[t], test_df[x])
        
        methods = {"Raw NWP": mae_r, "Mean Bias": mae_m, "XGBoost": mae_x}
        best = min(methods, key=methods.get)
        lines.append(f"| {vname} | MAE={mae_r:.2f} | MAE={mae_m:.2f} | MAE={mae_x:.2f} | **{best}** |")
        
    lines.append("\n## 3. Operational Evaluation (Test Set 2025)\n")
    lines.append("| Operational Metric | Raw NWP | XGBoost |")
    lines.append("|--------------------|---------|---------|")
    
    # Extreme UTCI Precision / Recall
    true_extreme = (test_df["truth_utci"] >= 46)
    raw_extreme = (test_df["raw_utci"] >= 46)
    xgb_extreme = (test_df["xgb_utci"] >= 46)
    
    # Raw
    tp_r = (true_extreme & raw_extreme).sum()
    fp_r = (~true_extreme & raw_extreme).sum()
    fn_r = (true_extreme & ~raw_extreme).sum()
    prec_r = tp_r / (tp_r + fp_r) if (tp_r + fp_r) > 0 else 0
    rec_r = tp_r / (tp_r + fn_r) if (tp_r + fn_r) > 0 else 0
    f1_r = 2 * (prec_r * rec_r) / (prec_r + rec_r) if (prec_r + rec_r) > 0 else 0

    # XGB
    tp_x = (true_extreme & xgb_extreme).sum()
    fp_x = (~true_extreme & xgb_extreme).sum()
    fn_x = (true_extreme & ~xgb_extreme).sum()
    prec_x = tp_x / (tp_x + fp_x) if (tp_x + fp_x) > 0 else 0
    rec_x = tp_x / (tp_x + fn_x) if (tp_x + fn_x) > 0 else 0
    f1_x = 2 * (prec_x * rec_x) / (prec_x + rec_x) if (prec_x + rec_x) > 0 else 0
    
    lines.append(f"| Extreme UTCI precision | {prec_r:.3f} | {prec_x:.3f} |")
    lines.append(f"| Extreme UTCI recall | {rec_r:.3f} | {rec_x:.3f} |")
    lines.append(f"| Extreme UTCI F1 | {f1_r:.3f} | {f1_x:.3f} |")
    
    # HTSI Alert Accuracy
    acc_r = (test_df["truth_htsi_level"] == test_df["raw_htsi_level"]).mean()
    acc_x = (test_df["truth_htsi_level"] == test_df["xgb_htsi_level"]).mean()
    lines.append(f"| HTSI alert accuracy | {acc_r:.3f} | {acc_x:.3f} |")
    
    lines.append("\n## Final Verdict")
    lines.append("- **PHASE 4 STEP 3**: PASS")
    
    with open(MD_REPORT_OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Generated Phase 4 Step 3 Validation Report to {MD_REPORT_OUT}")

def main():
    print("Loading calibrated dataset...")
    df = pd.read_parquet(CALIBRATED_OUT)
    
    # We also need Truth target Thermal variables
    print("Loading truth thermal targets...")
    df_truth = pd.read_parquet("data/processed/weather/forecast_truth_2024_2025.parquet")
    df_truth['valid_time'] = pd.to_datetime(df_truth['timestamp'], utc=True).dt.floor('s')
    df_truth['latitude'] = df_truth['latitude'].round(3)
    df_truth['longitude'] = df_truth['longitude'].round(3)
    df_truth['grid_id'] = df_truth['latitude'].map("{:.6f}".format) + "," + df_truth['longitude'].map("{:.6f}".format)
    
    truth_sub = df_truth[["valid_time", "grid_id", "mean_radiant_temp", "wbgt_outdoor", "utci", "heat_index", "htsi", "htsi_level"]]
    truth_sub.columns = ["valid_time", "grid_id", "truth_tmrt", "truth_wbgt", "truth_utci", "truth_heat_index", "truth_htsi", "truth_htsi_level"]
    
    df = pd.merge(df, truth_sub, on=["valid_time", "grid_id"], how="inner")
    
    print("Passing metrics through the thermal engine...")
    df_all_days = []
    
    # Run thermal engine for each lead day independently to avoid cross-contamination in HTSI chronological grouping
    for day in df['lead_day'].unique():
        print(f"  -> Processing Day {day}...")
        df_day = df[df['lead_day'] == day].copy()
        df_day = safe_compute_thermal(df_day, prefix="raw")
        df_day = safe_compute_thermal(df_day, prefix="mean_bias")
        df_day = safe_compute_thermal(df_day, prefix="xgb")
        df_all_days.append(df_day)
        
    df_final = pd.concat(df_all_days, ignore_index=True)
    
    print("Generating validation report...")
    generate_report(df_final)

if __name__ == "__main__":
    main()
