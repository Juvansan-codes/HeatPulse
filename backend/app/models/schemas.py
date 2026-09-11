from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Health
class HealthResponse(BaseModel):
    status: str
    database: str

# Overview
class OverviewResponse(BaseModel):
    initialization_time: Optional[datetime]
    ward_count: int
    active_alerts_count: int
    available_horizons_hours: List[int]
    highest_risk_by_day: List[Dict[str, Any]]

# Ward Geometry
class WardFeatureProperties(BaseModel):
    ward_id: int
    ward_name: str
    zone_id: Optional[str]
    area_km2: Optional[float]

class WardFeature(BaseModel):
    type: str = "Feature"
    properties: WardFeatureProperties
    geometry: Dict[str, Any]

class WardCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[WardFeature]

# Ward Detail
class WardDetailResponse(BaseModel):
    ward_id: int
    ward_name: str
    zone_id: Optional[str]
    area_km2: Optional[float]
    population: Optional[float]
    population_density: Optional[float]
    population_source: Optional[str]
    population_vintage: Optional[int]
    healthcare_facility_count: Optional[int]
    healthcare_facilities_per_10000_derived_population: Optional[float]
    vulnerability: Optional[float]
    vulnerability_model: Optional[str]

# Forecast
class ForecastRecord(BaseModel):
    initialization_time: datetime
    valid_time: datetime
    lead_day: int
    lead_hours: int
    assigned_grid_id: str
    temperature_2m: Optional[float] = None
    relative_humidity: Optional[float] = None
    wind_speed_10m: Optional[float] = None
    solar_radiation: Optional[float] = None
    mean_radiant_temp: Optional[float] = None
    wbgt_outdoor: Optional[float] = None
    utci: Optional[float] = None
    heat_index: Optional[float] = None
    thermal_hazard_score: Optional[float] = None
    burden_24h: Optional[float] = None
    burden_72h: Optional[float] = None
    htsi: Optional[float] = None
    htsi_level: Optional[int] = None
    htsi_label: Optional[str] = None
    human_heat_risk: Optional[float] = None
    extreme_utci_flag: Optional[bool] = None
    ward_id: Optional[int] = None

class WardForecastResponse(BaseModel):
    ward_id: int
    forecast: List[ForecastRecord]

class ForecastListResponse(BaseModel):
    forecasts: List[ForecastRecord]
    count: int

# Alerts
class AlertRecord(BaseModel):
    ward_id: int
    start_time: datetime
    end_time: datetime
    peak_time: Optional[datetime]
    maximum_alert_level: Optional[int]
    peak_htsi: Optional[float]
    peak_utci: Optional[float]
    peak_risk: Optional[float]
    extreme_utci_flag: Optional[bool]

class AlertsResponse(BaseModel):
    alerts: List[AlertRecord]
    count: int

# Horizon
class HorizonResponse(BaseModel):
    initialization_time: Optional[datetime]
    valid_times: List[datetime]
    lead_hours: List[int]
    number_of_grids: int
    number_of_wards: int
    horizon_length_hours: int

# Explainability
class ExplanationRisk(BaseModel):
    human_heat_risk: Optional[float]
    heat_hazard: Optional[float]

class ExplanationHeatHazard(BaseModel):
    htsi: Optional[float]
    htsi_level: Optional[int]
    htsi_label: Optional[str]
    utci: Optional[float]
    wbgt: Optional[float]
    heat_index: Optional[float]
    tmrt: Optional[float]
    burden_24h: Optional[float]
    burden_72h: Optional[float]
    extreme_utci_flag: Optional[bool]

class ExplanationExposure(BaseModel):
    population: Optional[float]
    population_density: Optional[float]
    population_density_city_percentile: Optional[float]

class ExplanationVulnerability(BaseModel):
    vulnerability: Optional[float]
    vulnerability_city_percentile: Optional[float]
    healthcare_facility_count: Optional[int]
    healthcare_facilities_per_10000: Optional[float]
    healthcare_availability_city_percentile: Optional[float]

class ExplanationDriver(BaseModel):
    category: str
    label: str
    value: Optional[float] = None
    unit: Optional[str] = None
    description: str

class ExplanationResponse(BaseModel):
    ward_id: int
    ward_name: Optional[str] = None
    initialization_time: Optional[datetime] = None
    valid_time: Optional[datetime] = None
    lead_hours: Optional[int] = None
    risk: ExplanationRisk
    heat_hazard: ExplanationHeatHazard
    exposure: ExplanationExposure
    vulnerability: ExplanationVulnerability
    drivers: List[ExplanationDriver]
    summary: str
