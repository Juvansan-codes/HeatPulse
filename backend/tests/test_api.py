import pytest
from fastapi.testclient import TestClient
from app.main import app
import os
from dotenv import load_dotenv

# Load env safely
load_dotenv()
has_db = bool(os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_KEY"))

client = TestClient(app)

@pytest.mark.skipif(not has_db, reason="Live DB credentials required")
def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "ok"

@pytest.mark.skipif(not has_db, reason="Live DB credentials required")
def test_overview():
    response = client.get("/api/v1/overview")
    assert response.status_code == 200
    data = response.json()
    assert "initialization_time" in data
    assert data["ward_count"] == 200
    assert "active_alerts_count" in data
    assert len(data["available_horizons_hours"]) == 5

@pytest.mark.skipif(not has_db, reason="Live DB credentials required")
def test_wards_collection():
    response = client.get("/api/v1/wards")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 200
    # verify a feature
    feat = data["features"][0]
    assert feat["type"] == "Feature"
    assert "ward_id" in feat["properties"]
    assert "geometry" in feat

@pytest.mark.skipif(not has_db, reason="Live DB credentials required")
def test_ward_detail_valid():
    # Use ward_id=1 as valid
    response = client.get("/api/v1/wards/1")
    assert response.status_code == 200
    data = response.json()
    assert data["ward_id"] == 1
    assert "population" in data
    assert "vulnerability" in data

@pytest.mark.skipif(not has_db, reason="Live DB credentials required")
def test_ward_detail_invalid():
    # We deleted ward 0
    response = client.get("/api/v1/wards/0")
    assert response.status_code == 404

@pytest.mark.skipif(not has_db, reason="Live DB credentials required")
def test_ward_forecast():
    response = client.get("/api/v1/wards/1/forecast")
    assert response.status_code == 200
    data = response.json()
    assert data["ward_id"] == 1
    assert len(data["forecast"]) == 5
    f0 = data["forecast"][0]
    assert "initialization_time" in f0
    assert "valid_time" in f0
    assert "temperature_2m" in f0

@pytest.mark.skipif(not has_db, reason="Live DB credentials required")
def test_forecast_horizon():
    response = client.get("/api/v1/forecast/horizon")
    assert response.status_code == 200
    data = response.json()
    assert data["number_of_grids"] == 5
    assert data["number_of_wards"] == 200
    assert data["horizon_length_hours"] == 120
    assert len(data["lead_hours"]) == 5

@pytest.mark.skipif(not has_db, reason="Live DB credentials required")
def test_alerts():
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    data = response.json()
    assert "alerts" in data
    assert "count" in data
    assert data["count"] == 0 # we know it's currently 0 for this window

@pytest.mark.skipif(not has_db, reason="Live DB credentials required")
def test_ward_explanation():
    # 1. Valid ward + valid lead_day
    response = client.get("/api/v1/wards/1/explanation?lead_day=1")
    assert response.status_code == 200
    data = response.json()
    assert data["ward_id"] == 1
    assert "summary" in data
    assert "drivers" in data
    assert "heat_hazard" in data
    assert "exposure" in data
    assert "vulnerability" in data
    
    # Check percentile boundaries
    vul_pct = data["vulnerability"].get("vulnerability_city_percentile")
    if vul_pct is not None:
        assert 0 <= vul_pct <= 100
        
    # Check deterministic labels
    drivers = data["drivers"]
    for d in drivers:
        assert d["category"] in ["heat_hazard", "exposure", "vulnerability"]
        assert "importance" not in d  # constraint check
        if d["label"] == "High HTSI level":
            assert "HTSI level of" in d["description"]
            assert data["heat_hazard"]["htsi_level"] >= 3
            
    # 2. Invalid horizon (e.g. no lead_day or valid_time provided)
    res_invalid = client.get("/api/v1/wards/1/explanation")
    assert res_invalid.status_code == 400
    
    # 3. Nonexistent ward
    res_404 = client.get("/api/v1/wards/999999/explanation?lead_day=1")
    assert res_404.status_code == 404
