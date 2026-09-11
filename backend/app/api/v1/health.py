from fastapi import APIRouter
from app.services.api_service import get_health
from app.models.schemas import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Returns service and database connectivity health.
    """
    return get_health()
