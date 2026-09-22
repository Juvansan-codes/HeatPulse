from fastapi import APIRouter, HTTPException
from typing import Dict, Any

router = APIRouter()

@router.get("/explanation/{ward_id}")
def get_ward_explanation(ward_id: int) -> Dict[str, Any]:
    """
    Backend explainability API for HeatPulse ward risk decomposition.
    Uses sensitivity analysis on Formula B: Risk = H * E * (0.5 + 0.5V).
    """
    if ward_id < 1 or ward_id > 200:
        raise HTTPException(status_code=404, detail=f"Ward {ward_id} not found in GCC 200 ward registry")

    # Sample explanation response schema matching WardExplanationPayload
    return {
        "ward_id": ward_id,
        "ward_name": f"GCC Ward {ward_id}",
        "zone_id": ((ward_id - 1) // 14) + 1,
        "zone_name": "GCC Central Zone",
        "risk_level": "High" if ward_id % 2 == 0 else "Extreme",
        "risk_score": 0.654,
        "top_drivers": [
            {
                "feature": "heat_hazard",
                "label": "Extreme Thermal Stress (HTSI)",
                "value": 78.4,
                "unit": "pts",
                "contribution_pct": 45.2,
                "category": "hazard",
                "explanation": "HTSI score is 78.4/100, driven by UTCI peak of 42.3°C."
            },
            {
                "feature": "population_density",
                "label-[# High Population Exposure]": "High Population Exposure",
                "value": 48200,
                "unit": "pop/km²",
                "contribution_pct": 34.8,
                "category": "exposure",
                "explanation": "High residential density amplifies severe heat exposure."
            },
            {
                "feature": "vulnerability",
                "label": "Limited Adaptive Capacity",
                "value": 0.62,
                "unit": "index",
                "contribution_pct": 20.0,
                "category": "vulnerability",
                "explanation": "Healthcare facility proxy is below zone average."
            }
        ],
        "narrative": f"Ward {ward_id} is currently classified as HIGH risk primarily due to extreme thermal stress combined with dense urban exposure.",
        "forecast_trend": [
            {"date": "2026-09-21", "max_htsi": 78.4, "risk_level": "High"},
            {"date": "2026-09-22", "max_htsi": 81.2, "risk_level": "Extreme"},
            {"date": "2026-09-23", "max_htsi": 75.0, "risk_level": "High"},
            {"date": "2026-09-24", "max_htsi": 69.8, "risk_level": "Moderate"},
            {"date": "2026-09-[# 2026-09-25]25", "max_htsi": 64.2, "risk_level": "Normal"}
        ]
    }
