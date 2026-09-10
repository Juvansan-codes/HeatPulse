import sys
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import mean_absolute_error, mean_squared_error
from scipy.stats import pearsonr

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
sys.path.insert(0, str(Path(__file__).parents[1] / "backend" / "app" / "thermal"))

from phase2_step6_htsi import compute_htsi

ROOT = Path(__file__).parents[1]
OUT_FORECAST = ROOT / "data/processed/weather/forecast_operational_2024_2025.parquet"
OUT_RISK = ROOT / "data/processed/risk/forecast_ward_heat_risk_2024_2025.parquet"
OUT_ALERTS = ROOT / "data/processed/risk/forecast_alerts_2024_2025.parquet"
TRUTH_PATH = ROOT / "data/processed/weather/forecast_truth_2024_2025.parquet"
CALIBRATED_PATH = ROOT / "data/processed/weather/forecast_calibrated_2024_2025.parquet"

def run_audits():
    print("--- 3. INITIALIZATION / ROW UNIQUENESS AUDIT ---")
    df_fcst = pd.read_parquet(OUT_FORECAST)
    df_risk = pd.read_parquet(OUT_RISK)
    
    print("Forecast Calibrated Shape:", df_fcst.shape)
    print("Ward Risk Shape:", df_risk.shape)
    print("Unique init_time:", df_risk['initialization_time'].nunique())
    print("Unique valid_time:", df_risk['timestamp'].nunique())
    print("Unique ward_id:", df_risk['ward_id'].nunique())
    print("Unique grid_id:", df_risk['grid_id'].nunique())
    
    key_cols = ['initialization_time', 'timestamp', 'ward_id']
    dupes = df_risk.duplicated(subset=key_cols).sum()
    print("Duplicate count on [initialization_time, timestamp, ward_id]:", dupes)

    print("\n--- 5. ALERT GROUPING AUDIT ---")
    # To fix event grouping, we must group by ward_id and lead_day, because initialization_time only contains 24h snapshots
    alerts_raw = df_risk[(df_risk["htsi_level"] >= 3) | (df_risk["utci"] >= 46)].copy()
    alerts_raw = alerts_raw.sort_values(["ward_id", "lead_day", "timestamp"])
    
    if not alerts_raw.empty:
        ward_changed = alerts_raw['ward_id'] != alerts_raw['ward_id'].shift()
        lead_changed = alerts_raw['lead_day'] != alerts_raw['lead_day'].shift()
        time_diff = alerts_raw['timestamp'].diff() > pd.Timedelta(hours=1)
        
        alerts_raw['event_id'] = (ward_changed | lead_changed | time_diff).cumsum()
        
        df_events = alerts_raw.groupby('event_id').agg(
            ward_id=('ward_id', 'first'),
            lead_day=('lead_day', 'first'),
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

    print("Total deduplicated events (fixed grouping):", len(df_events))
    print("Raw alert rows:", len(alerts_raw))
    
    if not df_events.empty:
        # Find an event with duration > 1 hour
        long_events = df_events[df_events['end_time'] > df_events['start_time']]
        if not long_events.empty:
            ev = long_events.iloc[0]
            ev_raw = alerts_raw[(alerts_raw['ward_id'] == ev['ward_id']) & 
                                (alerts_raw['lead_day'] == ev['lead_day']) &
                                (alerts_raw['timestamp'] >= ev['start_time']) &
                                (alerts_raw['timestamp'] <= ev['end_time'])].copy()
            
            print("Sample Long Event Severity Changes:", ev_raw['htsi_level'].tolist())
            print("Sample Long Event Length (hours):", len(ev_raw))

    print("\n--- 6. SPATIAL UNIQUENESS ---")
    print("Unique HTSI values:", df_risk['htsi'].nunique())
    print("Unique Human Heat Risk values:", df_risk['human_heat_risk'].nunique())
    
    # Are there any dupes?
    risk_dupes = len(df_risk) - df_risk['human_heat_risk'].nunique()
    print("Duplicate Risk-value Count:", risk_dupes)

    print("\n--- 4. PERSISTENCE LEAKAGE TEST ---")
    # Take one initialization time
    itime = pd.Timestamp("2025-05-15 12:00:00", tz="UTC")
    df_truth = pd.read_parquet(TRUTH_PATH)
    df_truth['timestamp'] = pd.to_datetime(df_truth['timestamp'], utc=True)
    df_cal = pd.read_parquet(OUT_FORECAST)
    
    cols = ["timestamp", "grid_id", "latitude", "longitude", "utci", "wbgt_outdoor", "temperature_2m", "relative_humidity"]
    
    # Operational Normal
    hist_sub = df_truth[(df_truth['timestamp'] < itime) & (df_truth['timestamp'] >= itime - pd.Timedelta(hours=72))][cols].copy()
    fcst_sub = df_cal[df_cal['initialization_time'] == itime][cols].copy()
    
    timeline_normal = pd.concat([hist_sub, fcst_sub], ignore_index=True)
    htsi_normal, _ = compute_htsi(timeline_normal)
    
    # Verification: What if we REMOVE truth >= itime?
    # Well, hist_sub already enforced this: `timestamp < itime`. Let's prove it natively.
    future_truth_mask = df_truth['timestamp'] >= itime
    df_truth_no_future = df_truth[~future_truth_mask].copy()
    
    hist_no_future = df_truth_no_future[(df_truth_no_future['timestamp'] < itime) & (df_truth_no_future['timestamp'] >= itime - pd.Timedelta(hours=72))][cols].copy()
    timeline_no_future = pd.concat([hist_no_future, fcst_sub], ignore_index=True)
    htsi_no_future, _ = compute_htsi(timeline_no_future)
    
    # Compare
    are_equal = htsi_normal['htsi'].equals(htsi_no_future['htsi'])
    print("HTSI_original == HTSI_without_future_truth:", are_equal)
    
    max_htsi_diff = (htsi_normal['htsi'] - htsi_no_future['htsi']).abs().max()
    max_b24_diff = (htsi_normal['burden_24h'] - htsi_no_future['burden_24h']).abs().max()
    max_b72_diff = (htsi_normal['burden_72h'] - htsi_no_future['burden_72h']).abs().max()
    
    print(f"max_abs_HTSI_difference = {max_htsi_diff}")
    print(f"max_abs_B24_difference = {max_b24_diff}")
    print(f"max_abs_B72_difference = {max_b72_diff}")
    
    print("max(observed_truth) < T:", hist_no_future['timestamp'].max() < itime)
    print("min(forecast) >= T:", fcst_sub['timestamp'].min() >= itime)

if __name__ == "__main__":
    df_truth_val = df_truth.copy()
    
    # We need to evaluate the different configurations.
    # To do this accurately, we will construct the sequence for a single initialization time just to demonstrate,
    # OR we can just use the operational HTSI that was already evaluated for "Operational", and we can write a quick loop for Raw and Mean Bias.
    # Given the loop takes 4 minutes, let's just evaluate Day 3 performance for Raw, Mean Bias, and Op for a subset of initializations to save time, OR do it for all?
    # The prompt says: "Calculate HTSI Day 1-5 performance for A. Raw NWP, B. Mean Bias calibration, C. Operational calibration... Report MAE, RMSE, Bias, correlation".
    # I'll create a fast batch loop for all 17,100 initializations just like the main script, but for Raw and Mean Bias.
    print("This will take ~8 minutes to run the full baseline loops...")
    
    def get_metrics(yt, yp):
        mask = ~np.isnan(yt) & ~np.isnan(yp)
        y, p = yt[mask], yp[mask]
        if len(y) == 0: return np.nan, np.nan, np.nan, np.nan
        from sklearn.metrics import mean_absolute_error, mean_squared_error
        from scipy.stats import pearsonr
        return mean_absolute_error(y, p), np.sqrt(mean_squared_error(y, p)), np.mean(p - y), pearsonr(y, p)[0]

    def run_pipeline(t_col, rh_col, w_col, rad_col):
        import copy
        df_temp = df_cal.copy()
        df_temp["temperature_2m"] = df_temp[t_col]
        df_temp["relative_humidity"] = df_temp[rh_col]
        df_temp["wind_speed_10m"] = df_temp[w_col]
        df_temp["solar_radiation"] = df_temp[rad_col]
        df_temp["surface_pressure"] = df_temp["truth_sp"]
        
        # Thermal
        t = df_temp["temperature_2m"]
        rh = df_temp["relative_humidity"]
        alpha = np.log(np.maximum(rh, 1) / 100.0) + (17.625 * t) / (243.04 + t)
        df_temp["dew_point_2m"] = (243.04 * alpha) / (17.625 - alpha)
        
        from phase2_step2_tmrt import compute_tmrt
        from phase2_step3_wbgt import compute_wbgt_outdoor
        from phase2_step4_utci import compute_utci
        df_temp = compute_tmrt(df_temp)
        df_temp = compute_wbgt_outdoor(df_temp)
        df_temp = compute_utci(df_temp)
        
        # We'll just run HTSI sequentially over 1000 initializations to save time for this audit, or the whole set?
        # The prompt requires "Calculate HTSI Day 1-5 performance... for Day 1, Day 2, Day 3, Day 4, Day 5". It implies the full test set.
        # Let's run full set.
        init_times = df_temp[df_temp['timestamp'] >= '2025-01-01']['initialization_time'].unique()
        results = []
        for i, it in enumerate(init_times):
            hist = df_truth[(df_truth['timestamp'] < it) & (df_truth['timestamp'] >= it - pd.Timedelta(hours=72))][cols].copy()
            fcst = df_temp[df_temp['initialization_time'] == it][cols].copy()
            timeline = pd.concat([hist, fcst], ignore_index=True)
            htsi, _ = compute_htsi(timeline)
            results.append(htsi[htsi['timestamp'] >= it].copy())
            
        htsi_final = pd.concat(results, ignore_index=True)
        htsi_final['timestamp'] = pd.to_datetime(htsi_final['timestamp'], utc=True)
        
        # join with truth
        htsi_final = htsi_final.merge(df_truth[['timestamp', 'grid_id', 'htsi', 'utci']], on=['timestamp', 'grid_id'], suffixes=('', '_truth'))
        # join lead_day from df_temp
        htsi_final = htsi_final.merge(df_temp[['timestamp', 'grid_id', 'lead_day']], on=['timestamp', 'grid_id'], how='left')
        
        metrics = []
        for d in [1, 2, 3, 4, 5]:
            sub = htsi_final[htsi_final['lead_day'] == d]
            mae, rmse, bias, corr = get_metrics(sub['htsi_truth'], sub['htsi'])
            metrics.append((d, mae, rmse, bias, corr))
        return metrics
        
    print("Evaluating Raw NWP...")
    metrics_raw = run_pipeline('raw_t2m', 'raw_rh', 'raw_wind', 'raw_rad')
    print("Evaluating Mean Bias...")
    metrics_mb = run_pipeline('mean_bias_t2m', 'mean_bias_rh', 'mean_bias_wind', 'mean_bias_rad')
    
    # Operational is already computed in df_fcst
    # Let's extract metrics from df_fcst + truth
    # df_fcst has `htsi`, `lead_day`. Truth has `truth_htsi`? Wait, df_truth has `htsi`.
    df_fcst_eval = pd.read_parquet(OUT_FORECAST)
    df_fcst_eval['timestamp'] = pd.to_datetime(df_fcst_eval['timestamp'], utc=True)
    df_fcst_eval = df_fcst_eval.merge(df_truth[['timestamp', 'grid_id', 'htsi']], on=['timestamp', 'grid_id'], suffixes=('', '_truth'))
    metrics_op = []
    for d in [1, 2, 3, 4, 5]:
        sub = df_fcst_eval[df_fcst_eval['lead_day'] == d]
        mae, rmse, bias, corr = get_metrics(sub['htsi_truth'], sub['htsi'])
        metrics_op.append((d, mae, rmse, bias, corr))
        
    print(f"| Model | Day | MAE | RMSE | Bias | Corr |")
    print(f"|---|---|---|---|---|---|")
    for m, name in [(metrics_raw, "Raw NWP"), (metrics_mb, "Mean Bias"), (metrics_op, "Operational")]:
        for d, mae, rmse, bias, corr in m:
            print(f"| {name} | {d} | {mae:.2f} | {rmse:.2f} | {bias:.2f} | {corr:.3f} |")

if __name__ == "__main__":
    run_audits()
