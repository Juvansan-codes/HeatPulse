from fastapi import APIRouter, Query
from app.services.api_service import get_forecasts, get_horizon
from app.models.schemas import ForecastListResponse, HorizonResponse
from typing import Optional
from datetime import datetime

router = APIRouter()

@router.get("/forecast", response_model=ForecastListResponse)
def list_forecast(
    lead_day: Optional[int] = Query(None, description="Filter by forecast lead day (1-5)"),
    valid_time: Optional[datetime] = Query(None, description="Filter by exact ISO valid_time")
):
    """
    Provides forecast data across all wards filtered by day or time.
    """
    return get_forecasts(lead_day, valid_time)

@router.get("/forecast/horizon", response_model=HorizonResponse)
def get_forecast_horizon():
    """
    Returns metadata about the active operational forecast.
    """
    return get_horizon()
