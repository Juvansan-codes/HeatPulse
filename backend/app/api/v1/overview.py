from fastapi import APIRouter
from app.services.api_service import get_overview
from app.models.schemas import OverviewResponse

router = APIRouter()

@router.get("/overview", response_model=OverviewResponse)
def get_dashboard_overview():
    """
    Provides top-level metrics for the HeatPulse dashboard.
    """
    return get_overview()
