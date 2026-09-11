from fastapi import APIRouter
from app.services.api_service import get_alerts
from app.models.schemas import AlertsResponse

router = APIRouter()

@router.get("/alerts", response_model=AlertsResponse)
def list_alerts():
    """
    Returns all active ward alerts. Can be empty (0 rows) if none exist.
    """
    return get_alerts()
