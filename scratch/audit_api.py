import requests
import time
import json
from pprint import pprint

BASE_URL = "https://heatpulse.onrender.com/api/v1"

results = []

def test_endpoint(name, path, expected_status=200):
    url = f"{BASE_URL}{path}"
    start_time = time.time()
    try:
        response = requests.get(url, timeout=10)
        elapsed = time.time() - start_time
        status = response.status_code
        
        try:
            data = response.json()
            json_valid = True
        except:
            data = response.text
            json_valid = False
            
        success = (status == expected_status)
        results.append({
            "name": name,
            "path": path,
            "status": status,
            "expected_status": expected_status,
            "time": elapsed,
            "json_valid": json_valid,
            "data": data,
            "success": success
        })
        return success, data, elapsed
    except Exception as e:
        results.append({
            "name": name,
            "path": path,
            "status": "ERROR",
            "expected_status": expected_status,
            "time": time.time() - start_time,
            "json_valid": False,
            "data": str(e),
            "success": False
        })
        return False, None, time.time() - start_time


print("--- STARTING API AUDIT ---")
# 1. Health
success, data, elapsed = test_endpoint("Health", "/health")
print(f"Health: {success} ({elapsed:.2f}s)")
if success:
    assert data["status"] == "ok"
    assert data["database"] == "ok"

# 2. Overview
success, data, elapsed = test_endpoint("Overview", "/overview")
print(f"Overview: {success} ({elapsed:.2f}s)")
if success:
    assert data["ward_count"] == 200
    assert data["active_alerts_count"] == 0
    assert len(data["available_horizons_hours"]) == 5
    assert len(data["highest_risk_by_day"]) == 5

# 3. Wards
success, data, elapsed = test_endpoint("Wards", "/wards")
print(f"Wards: {success} ({elapsed:.2f}s)")
if success:
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 200
    f0 = data["features"][0]
    assert "ward_name" in f0["properties"]
    assert "zone_id" in f0["properties"]
    assert "geometry" in f0
    assert f0["geometry"]["type"] in ["Polygon", "MultiPolygon"]

# 4. Ward Detail (Valid)
success, data, elapsed = test_endpoint("Ward Detail (Valid 1)", "/wards/1")
print(f"Ward Detail 1: {success} ({elapsed:.2f}s)")
if success:
    assert data["ward_id"] == 1
    assert "ward_name" in data
    assert "population" in data
    assert "population_density" in data
    assert "vulnerability" in data

success, data, elapsed = test_endpoint("Ward Detail (Valid 100)", "/wards/100")
print(f"Ward Detail 100: {success} ({elapsed:.2f}s)")

# 5. Ward Detail (Invalid)
success, data, elapsed = test_endpoint("Ward Detail (Invalid 999999)", "/wards/999999", expected_status=404)
print(f"Ward Detail Invalid: {success} ({elapsed:.2f}s)")

# 6. Horizon
success, data, elapsed = test_endpoint("Horizon", "/forecast/horizon")
print(f"Horizon: {success} ({elapsed:.2f}s)")
if success:
    assert data["number_of_grids"] == 5
    assert data["number_of_wards"] == 200
    assert data["horizon_length_hours"] == 120
    assert len(data["valid_times"]) == 5

# 7. Ward Forecast
success, data, elapsed = test_endpoint("Ward Forecast", "/wards/1/forecast")
print(f"Ward Forecast: {success} ({elapsed:.2f}s)")
if success:
    assert len(data["forecast"]) == 5
    f0 = data["forecast"][0]
    assert "temperature_2m" in f0
    assert "htsi" in f0
    assert "human_heat_risk" in f0
    assert f0["htsi"] is not None
    assert f0["human_heat_risk"] is not None

# 8. City-Wide Forecast (Lead Day 1-5)
for d in range(1, 6):
    success, data, elapsed = test_endpoint(f"City Forecast (Day {d})", f"/forecast?lead_day={d}")
    print(f"City Forecast {d}: {success} ({elapsed:.2f}s)")
    if success:
        assert len(data["forecasts"]) == 200

# 9. Alerts
success, data, elapsed = test_endpoint("Alerts", "/alerts")
print(f"Alerts: {success} ({elapsed:.2f}s)")
if success:
    assert data["count"] == 0
    assert len(data["alerts"]) == 0

print("--- AUDIT COMPLETE ---")
with open("audit_results.json", "w") as f:
    json.dump(results, f)
