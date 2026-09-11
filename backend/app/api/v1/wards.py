from fastapi import APIRouter, Path
from app.services.api_service import get_all_wards, get_ward_detail, get_ward_forecast
from app.models.schemas import WardCollection, WardDetailResponse, WardForecastResponse

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
