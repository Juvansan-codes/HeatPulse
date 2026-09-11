from fastapi import APIRouter, Path
from app.services.api_service import get_all_wards, get_ward_detail, get_ward_forecast, get_explanation
from app.models.schemas import WardCollection, WardDetailResponse, WardForecastResponse, ExplanationResponse
from typing import Optional
from datetime import datetime

router = APIRouter()

@router.get("/wards", response_model=WardCollection)
def list_wards():
    """
    Returns all 200 wards as a GeoJSON FeatureCollection.
    """
    return get_all_wards()

@router.get("/wards/{ward_id}", response_model=WardDetailResponse)
def get_ward(ward_id: int = Path(..., description="The integer ID of the ward")):
    """
    Returns specific static intelligence and vulnerability details for a ward.
    """
    return get_ward_detail(ward_id)

@router.get("/wards/{ward_id}/forecast", response_model=WardForecastResponse)
def ward_forecast(ward_id: int = Path(..., description="The integer ID of the ward")):
    """
    Returns the complete 5-horizon forecast for the requested ward.
    """
    return get_ward_forecast(ward_id)

@router.get("/wards/{ward_id}/explanation", response_model=ExplanationResponse)
def ward_explanation(
    ward_id: int = Path(..., description="The integer ID of the ward"),
    lead_day: Optional[int] = None,
    valid_time: Optional[datetime] = None
):
    """
    Returns a structured, deterministic explanation of the operational heat-impact risk for a given ward and forecast horizon.
    """
    return get_explanation(ward_id, lead_day, valid_time)
