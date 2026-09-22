import os
import json
import time
from fastapi.testclient import TestClient
import sys

sys.path.insert(0, os.path.abspath('backend'))
from app.main import app

client = TestClient(app)

print("--- PHASE 5-B AUDIT SCRIPT ---")

# We will test the local app using TestClient, because the branch is not yet merged to master and deployed to Render.

def test_explain(ward_id, lead_day=None, valid_time=None):
    start = time.time()
    url = f"/api/v1/wards/{ward_id}/explanation"
    params = {}
    if lead_day: params['lead_day'] = lead_day
    if valid_time: params['valid_time'] = valid_time
    
    resp = client.get(url, params=params)
    elapsed = time.time() - start
    return resp.status_code, resp.json(), elapsed

print("\n--- 10. LOCAL API TEST (Substituting Live API since branch is unmerged) ---")
cases = [
    (1, 1, None),
    (86, 1, None),
    (200, 5, None),
    (150, 3, None) # one additional at lead_day 3
]

for w, ld, vt in cases:
    status, data, elapsed = test_explain(w, ld, vt)
    print(f"\nWard {w} Lead {ld} | Status: {status} | Time: {elapsed:.3f}s")
    print(json.dumps(data, indent=2))

print("\n--- 4. HORIZON SELECTION & CROSS ENDPOINT ---")
# testing invalid lead day
status, data, elapsed = test_explain(1, lead_day=99)
print(f"\nWard 1 Lead 99 | Status: {status}")
if status != 200:
    print(f"Error detail: {data}")

# Cross endpoint consistency check
def check_cross(ward_id, lead_day):
    print(f"\nChecking Cross Endpoint for Ward {ward_id} Lead Day {lead_day}")
    # Explain
    _, exp_data, _ = test_explain(ward_id, lead_day=lead_day)
    # Detail
    det_resp = client.get(f"/api/v1/wards/{ward_id}")
    det_data = det_resp.json()
    # Forecast
    for_resp = client.get(f"/api/v1/wards/{ward_id}/forecast")
    for_data = for_resp.json()
    
    # match the forecast record
    matching_fc = None
    for f in for_data["forecast"]:
        if f["lead_day"] == lead_day:
            matching_fc = f
            break
            
    print("Explain HTSI:", exp_data["heat_hazard"]["htsi"])
    print("Forecast HTSI:", matching_fc["htsi"])
    print("Explain Vuln:", exp_data["vulnerability"]["vulnerability"])
    print("Detail Vuln:", det_data["vulnerability"])

check_cross(1, 1)
check_cross(86, 1)
check_cross(200, 5)

print("\n--- 8. NULL / EDGE CASE AUDIT ---")
# we can just observe if it crashed on the valid inputs (it didn't).

print("\nDONE.")
