import os
import sys
import pandas as pd
from pathlib import Path

TRUTH_PATH = Path("data/processed/weather/forecast_truth_2024_2025.parquet")
HINDCAST_PATH = Path("data/processed/weather/forecast_hindcast_raw_2024_2025.parquet")
CALIBRATED_PATH = Path("data/processed/weather/forecast_calibrated_2024_2025.parquet")
MODEL_DIR = Path("models/phase4_step3")

def test_temporal_split_and_data_integrity():
    df_raw = pd.read_parquet(HINDCAST_PATH)
    df_raw['timestamp'] = pd.to_datetime(df_raw['timestamp'], utc=True)
    
    df = pd.read_parquet(CALIBRATED_PATH)
    df['valid_time'] = pd.to_datetime(df['valid_time'], utc=True)
    
    train = df[df['split'] == 'train']
    val = df[df['split'] == 'val']
    test = df[df['split'] == 'test']
    
    # 1. correct temporal split and no overlap
    assert train['valid_time'].min() >= pd.to_datetime('2024-01-01', utc=True)
    assert train['valid_time'].max() <= pd.to_datetime('2024-09-30 23:59:59', utc=True)
    
    assert val['valid_time'].min() >= pd.to_datetime('2024-10-01', utc=True)
    assert val['valid_time'].max() <= pd.to_datetime('2024-12-31 23:59:59', utc=True)
    
    assert test['valid_time'].min() >= pd.to_datetime('2025-01-01', utc=True)
    assert test['valid_time'].max() <= pd.to_datetime('2025-12-31 23:59:59', utc=True)
    
    # 2. 2025 unseen
    # Training mask strictly ended before 2025
    assert len(set(train['valid_time']).intersection(set(test['valid_time']))) == 0
    assert len(set(val['valid_time']).intersection(set(test['valid_time']))) == 0
    
    # 3. Expected feature columns exist
    expected_features = ["initialization_time", "valid_time", "lead_day", "lead_hours", "grid_id", 
                         "raw_t2m", "raw_rh", "raw_wind", "raw_rad", 
                         "xgb_t2m", "xgb_rh", "xgb_wind", "xgb_rad"]
    for c in expected_features:
        assert c in df.columns
        
    # 4. Target = Truth - Forecast
    df['expected_err'] = df['truth_t2m'] - df['raw_t2m']
    # Not testing strict equality because of floating point, but very close:
    # We didn't save err in the final file, but we can check if xgb = raw + pred
    assert (abs(df['xgb_t2m'] - (df['raw_t2m'] + df['pred_err_t2m'])) < 0.001).all()
    
    # 5. Physical bounds
    assert (df['xgb_rh'] >= 0).all()
    assert (df['xgb_rh'] <= 100).all()
    assert (df['xgb_wind'] >= 0).all()
    assert (df['xgb_rad'] >= 0).all()
    
    # 6. Grids and Lead days
    assert set(df['lead_day'].unique()) == {1, 2, 3, 4, 5}
    assert df['grid_id'].nunique() == 5
    
    # 7. Model artifacts
    for var in ['t2m', 'rh', 'wind', 'rad']:
        assert (MODEL_DIR / f"xgb_{var}.json").exists()

if __name__ == "__main__":
    test_temporal_split_and_data_integrity()
    print("All Phase 4 Step 3 Tests Passed!")
