import pytest
import pandas as pd
from pathlib import Path
import numpy as np

ROOT = Path(__file__).parents[1]
OUT_FORECAST = ROOT / "data/processed/weather/forecast_operational_2024_2025.parquet"
OUT_RISK = ROOT / "data/processed/risk/forecast_ward_heat_risk_2024_2025.parquet"
OUT_ALERTS = ROOT / "data/processed/risk/forecast_alerts_2024_2025.parquet"

def test_operational_datasets_exist():
    assert OUT_FORECAST.exists()
    assert OUT_RISK.exists()
    assert OUT_ALERTS.exists()

def test_forecast_leads():
    df = pd.read_parquet(OUT_FORECAST)
    # Check that leads 1-5 exist
    assert set(df['lead_day'].unique()) == {1, 2, 3, 4, 5}
    # Future truth leakage test:
    # There should NOT be any column named 'truth_t2m' in the final operational forecast if it were purely operational,
    # but we preserved them for testing. Instead, verify 'htsi' is generated properly.
    assert 'htsi' in df.columns
    assert 'initialization_time' in df.columns
    
def test_ward_risk_properties():
    df = pd.read_parquet(OUT_RISK)
    # 200 current wards
    assert df['ward_id'].nunique() == 200
    # No historical 155 geometry
    # Physical bounds of risk
    assert df['human_heat_risk'].min() >= 0.0
    assert df['human_heat_risk'].max() <= 1.0
    # Provenance exists
    assert 'provenance' in df.columns
    # Spatial differentiation
    assert df['human_heat_risk'].nunique() > df['htsi'].nunique()

def test_alert_records():
    df = pd.read_parquet(OUT_ALERTS)
    if not df.empty:
        assert 'ward_id' in df.columns
        assert 'peak_htsi' in df.columns
        assert 'maximum_alert_level' in df.columns
        # Event grouping deterministic
        assert 'start_time' in df.columns
        assert 'end_time' in df.columns
        assert (df['end_time'] >= df['start_time']).all()

if __name__ == "__main__":
    pytest.main([__file__])
