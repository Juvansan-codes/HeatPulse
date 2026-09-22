import sys
import pandas as pd
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
from phase2_step6_htsi import compute_htsi

def test_leakage_boundary():
    # Synthetic truth
    t_truth = pd.date_range('2025-01-01', '2025-01-05 23:00:00', freq='h')
    df_truth = pd.DataFrame({
        'timestamp': t_truth,
        'latitude': 13.0, 'longitude': 80.0,
        'utci': 25.0, 'wbgt_outdoor': 25.0,
        'temperature_2m': 25.0, 'relative_humidity': 50.0
    })
    
    # Initialization time: 2025-01-04 00:00:00
    init_time = pd.Timestamp('2025-01-04 00:00:00', tz='UTC')
    df_truth['timestamp'] = df_truth['timestamp'].dt.tz_localize('UTC')
    
    # Synthetic forecast
    t_forecast = pd.date_range('2025-01-04 00:00:00', '2025-01-05 23:00:00', freq='h')
    df_forecast = pd.DataFrame({
        'timestamp': t_forecast,
        'latitude': 13.0, 'longitude': 80.0,
        'utci': 50.0, 'wbgt_outdoor': 50.0,
        'temperature_2m': 50.0, 'relative_humidity': 90.0,
        'initialization_time': init_time,
        'valid_time': t_forecast
    })
    
    # Rule: Observations strictly BEFORE initialization time T
    history = df_truth[df_truth['timestamp'] < init_time].copy()
    future = df_forecast.copy()
    
    # Construct operational timeline
    cols = ['timestamp', 'latitude', 'longitude', 'utci', 'wbgt_outdoor', 'temperature_2m', 'relative_humidity']
    timeline = pd.concat([history[cols], future[cols]], ignore_index=True)
    
    # Pass to HTSI
    htsi_res, _ = compute_htsi(timeline)
    
    # Inspect boundaries
    res_at_T = htsi_res[htsi_res['timestamp'] == init_time]
    res_before_T = htsi_res[htsi_res['timestamp'] == init_time - pd.Timedelta(hours=1)]
    
    print("Time T (init):", init_time)
    print("B24 before T (from Truth, utci=25):", res_before_T['burden_24h'].values[0])
    print("B24 at T (from 23h Truth + 1h Forecast, utci=25/50):", res_at_T['burden_24h'].values[0])

if __name__ == "__main__":
    test_leakage_boundary()
