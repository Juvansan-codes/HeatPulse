import os
import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error
from scipy.stats import pearsonr

# Add backend and scripts to sys.path
sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
sys.path.insert(0, str(Path(__file__).parents[1] / "backend" / "app" / "thermal"))

from phase2_step2_tmrt import compute_tmrt
from phase2_step3_wbgt import compute_wbgt_outdoor
from phase2_step4_utci import compute_utci
from heat_index import calculate_heat_index

TRUTH_PATH = Path("data/processed/weather/forecast_truth_2024_2025.parquet")
HINDCAST_PATH = Path("data/processed/weather/forecast_hindcast_raw_2024_2025.parquet")
CALIBRATED_OUT = Path("data/processed/weather/forecast_calibrated_2024_2025.parquet")
MD_REPORT_OUT = Path("docs/phase4_step3_ml_calibration.md")
MODEL_DIR = Path("models/phase4_step3")
os.makedirs(MODEL_DIR, exist_ok=True)

def cyclical_encode(df, col, max_val):
    df[col + '_sin'] = np.sin(2 * np.pi * df[col] / max_val)
    df[col + '_cos'] = np.cos(2 * np.pi * df[col] / max_val)
    return df

def build_dataset():
    print("Loading data...")
    df_raw = pd.read_parquet(HINDCAST_PATH)
    df_truth = pd.read_parquet(TRUTH_PATH)
    
    df_raw['timestamp'] = pd.to_datetime(df_raw['timestamp'], utc=True).dt.floor('s')
    df_truth['timestamp'] = pd.to_datetime(df_truth['timestamp'], utc=True).dt.floor('s')
    df_raw['latitude'] = df_raw['latitude'].round(3)
    df_raw['longitude'] = df_raw['longitude'].round(3)
    df_truth['latitude'] = df_truth['latitude'].round(3)
    df_truth['longitude'] = df_truth['longitude'].round(3)
    
    # Truth sub
    truth_sub = df_truth[["timestamp", "latitude", "longitude", 
                          "temperature_2m", "relative_humidity", "wind_speed_10m", "solar_radiation",
                          "surface_pressure"]].copy()
    truth_sub.columns = ["timestamp", "latitude", "longitude", 
                         "truth_t2m", "truth_rh", "truth_wind", "truth_rad", "truth_sp"]
    
    print("Melting NWP to long format...")
    records = []
    # Drop rows without raw variables
    # We will iterate and construct long format
    # This is much faster vectorized:
    dfs_lead = []
    for day in [1, 2, 3, 4, 5]:
        cols = [
            "timestamp", "latitude", "longitude",
            f"temperature_2m_previous_day{day}",
            f"relative_humidity_2m_previous_day{day}",
            f"wind_speed_10m_previous_day{day}",
            f"shortwave_radiation_previous_day{day}"
        ]
        # Check if columns exist
        if not all(c in df_raw.columns for c in cols):
            continue
            
        df_d = df_raw[cols].copy()
        df_d.columns = ["timestamp", "latitude", "longitude", "raw_t2m", "raw_rh", "raw_wind", "raw_rad"]
        df_d['lead_day'] = day
        df_d['lead_hours'] = day * 24
        df_d['initialization_time'] = df_d['timestamp'] - pd.to_timedelta(df_d['lead_hours'], unit='h')
        dfs_lead.append(df_d)
        
    long_raw = pd.concat(dfs_lead, ignore_index=True)
    
    print("Merging truth targets...")
    df = pd.merge(long_raw, truth_sub, on=["timestamp", "latitude", "longitude"], how="inner")
    
    print("Calculating temporal features...")
    df['valid_time'] = df['timestamp']
    df['hour'] = df['valid_time'].dt.hour
    df['day_of_year'] = df['valid_time'].dt.dayofyear
    
    df = cyclical_encode(df, 'hour', 24)
    df = cyclical_encode(df, 'day_of_year', 365.25)
    
    # Target errors: Truth - Raw
    df['err_t2m'] = df['truth_t2m'] - df['raw_t2m']
    df['err_rh'] = df['truth_rh'] - df['raw_rh']
    df['err_wind'] = df['truth_wind'] - df['raw_wind']
    df['err_rad'] = df['truth_rad'] - df['raw_rad']
    
    # Mask splits
    df['split'] = 'unknown'
    df.loc[(df['valid_time'] >= '2024-01-01') & (df['valid_time'] <= '2024-09-30 23:59:59'), 'split'] = 'train'
    df.loc[(df['valid_time'] >= '2024-10-01') & (df['valid_time'] <= '2024-12-31 23:59:59'), 'split'] = 'val'
    df.loc[(df['valid_time'] >= '2025-01-01') & (df['valid_time'] <= '2025-12-31 23:59:59'), 'split'] = 'test'
    
    # Grid ID
    df['grid_id'] = df['latitude'].map("{:.6f}".format) + "," + df['longitude'].map("{:.6f}".format)
    
    # Drop rows with NaN in critical features
    df = df.dropna(subset=['raw_t2m', 'raw_rh', 'raw_wind', 'raw_rad', 'truth_t2m'])
    
    return df

def train_and_predict(df, var_name, raw_col, target_col):
    features = [
        raw_col, 'lead_day', 'lead_hours', 
        'hour_sin', 'hour_cos', 'day_of_year_sin', 'day_of_year_cos',
        'latitude', 'longitude'
    ]
    
    X_train = df[df['split'] == 'train'][features]
    y_train = df[df['split'] == 'train'][target_col]
    X_val = df[df['split'] == 'val'][features]
    y_val = df[df['split'] == 'val'][target_col]
    
    # 1. Simple Mean Bias Correction Baseline (computed on training data)
    # Average bias for this variable
    mean_bias = y_train.mean()
    df[f'mean_bias_{var_name}'] = df[raw_col] + mean_bias
    
    # 2. XGBoost Training
    print(f"Training XGBoost for {var_name}...")
    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        early_stopping_rounds=10,
        eval_metric='rmse'
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_train, y_train), (X_val, y_val)],
        verbose=False
    )
    
    # Save model
    model_path = MODEL_DIR / f"xgb_{var_name}.json"
    model.save_model(model_path)
    
    # Predict over the entire dataset
    df[f'pred_err_{var_name}'] = model.predict(df[features])
    df[f'xgb_{var_name}'] = df[raw_col] + df[f'pred_err_{var_name}']
    
    return df

def physical_post_process(df):
    affected = {}
    
    # RH: clamp [0, 100]
    rh_cols = ['mean_bias_rh', 'xgb_rh']
    affected['rh'] = 0
    for c in rh_cols:
        mask = (df[c] < 0) | (df[c] > 100)
        affected['rh'] += mask.sum()
        df[c] = df[c].clip(0, 100)
        
    # Wind: clamp >= 0
    wind_cols = ['mean_bias_wind', 'xgb_wind']
    affected['wind'] = 0
    for c in wind_cols:
        mask = df[c] < 0
        affected['wind'] += mask.sum()
        df[c] = df[c].clip(lower=0)
        
    # Radiation: clamp >= 0
    rad_cols = ['mean_bias_rad', 'xgb_rad']
    affected['rad'] = 0
    for c in rad_cols:
        mask = df[c] < 0
        affected['rad'] += mask.sum()
        df[c] = df[c].clip(lower=0)
        
    print("Physical Post-Processing Constraints Applied:")
    for k, v in affected.items():
        print(f" - {k}: {v} predictions clamped")
        
    return df

def main():
    df = build_dataset()
    print(f"Total built rows: {len(df)}")
    print(f"Train: {sum(df['split']=='train')}, Val: {sum(df['split']=='val')}, Test: {sum(df['split']=='test')}")
    
    # Verify Leakage logic
    assert np.all(df['initialization_time'] < df['valid_time']), "Leakage: Init time >= Valid time"
    
    # Train Models
    df = train_and_predict(df, "t2m", "raw_t2m", "err_t2m")
    df = train_and_predict(df, "rh", "raw_rh", "err_rh")
    df = train_and_predict(df, "wind", "raw_wind", "err_wind")
    df = train_and_predict(df, "rad", "raw_rad", "err_rad")
    
    df = physical_post_process(df)
    
    # Organize columns and save
    out_cols = [
        "initialization_time", "valid_time", "grid_id", "latitude", "longitude", "lead_day", "lead_hours", "split",
        "truth_t2m", "truth_rh", "truth_wind", "truth_rad", "truth_sp",
        "raw_t2m", "raw_rh", "raw_wind", "raw_rad",
        "mean_bias_t2m", "mean_bias_rh", "mean_bias_wind", "mean_bias_rad",
        "pred_err_t2m", "pred_err_rh", "pred_err_wind", "pred_err_rad",
        "xgb_t2m", "xgb_rh", "xgb_wind", "xgb_rad"
    ]
    df_out = df[out_cols].copy()
    df_out.to_parquet(CALIBRATED_OUT, index=False)
    print(f"Saved Calibrated Dataset to {CALIBRATED_OUT}")

if __name__ == "__main__":
    main()
