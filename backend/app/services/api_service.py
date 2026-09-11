from app.db.supabase import get_supabase_client
from app.models.schemas import (
    HealthResponse, OverviewResponse, WardCollection, WardFeature, WardFeatureProperties,
    WardDetailResponse, ForecastRecord, WardForecastResponse, ForecastListResponse,
    AlertsResponse, AlertRecord, HorizonResponse
)
from fastapi import HTTPException
from datetime import datetime
from typing import Optional, List

def get_health() -> HealthResponse:
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database client unavailable")
    try:
        res = supabase.table("wards").select("ward_id").limit(1).execute()
        return HealthResponse(status="ok", database="ok")
    except Exception as e:
        # Don't expose internal errors directly, just a generic service error
        raise HTTPException(status_code=503, detail="Database connectivity failed")

def get_overview() -> OverviewResponse:
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database client unavailable")
    
    # Init time and horizons
    grids_res = supabase.table("forecast_grids").select("initialization_time, valid_time, lead_hours").execute()
    grids_data = grids_res.data
    
    init_time = None
    horizons = []
    if grids_data:
        init_time = grids_data[0].get("initialization_time")
        horizons = sorted(list(set(g.get("lead_hours") for g in grids_data if g.get("lead_hours") is not None)))
    
    # Ward count
    ward_res = supabase.table("wards").select("ward_id", count="exact").limit(1).execute()
    ward_count = ward_res.count if ward_res.count is not None else 0
    
    # Alerts count
    alerts_res = supabase.table("ward_alerts").select("id", count="exact").limit(1).execute()
    active_alerts_count = alerts_res.count if alerts_res.count is not None else 0
    
    # Highest risk by day
    # We will query ward_forecast_risk
    risk_res = supabase.table("ward_forecast_risk").select("valid_time, human_heat_risk, ward_id, htsi_level").execute()
    highest_by_day = {}
    for r in risk_res.data:
        vt = r.get("valid_time")
        hhr = r.get("human_heat_risk") or 0.0
        if vt not in highest_by_day or hhr > highest_by_day[vt]["max_risk"]:
            highest_by_day[vt] = {
                "valid_time": vt,
                "max_risk": hhr,
                "ward_id": r.get("ward_id"),
                "max_htsi_level": r.get("htsi_level")
            }
    
    highest_risk_list = list(highest_by_day.values())
    
    return OverviewResponse(
        initialization_time=init_time,
        ward_count=ward_count,
        active_alerts_count=active_alerts_count,
        available_horizons_hours=horizons,
        highest_risk_by_day=highest_risk_list
    )

def get_all_wards() -> WardCollection:
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database client unavailable")
        
    res = supabase.table("wards").select("ward_id, ward_name, zone_id, area_km2, geom").execute()
    features = []
    for row in res.data:
        features.append(
            WardFeature(
                properties=WardFeatureProperties(
                    ward_id=row.get("ward_id"),
                    ward_name=row.get("ward_name"),
                    zone_id=row.get("zone_id"),
                    area_km2=row.get("area_km2")
                ),
                geometry=row.get("geom")
            )
        )
    return WardCollection(features=features)

def get_ward_detail(ward_id: int) -> WardDetailResponse:
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database client unavailable")
        
    w_res = supabase.table("wards").select("ward_id, ward_name, zone_id, area_km2").eq("ward_id", ward_id).execute()
    if not w_res.data:
        raise HTTPException(status_code=404, detail=f"Ward {ward_id} not found")
        
    w = w_res.data[0]
    
    e_res = supabase.table("ward_exposure").select("*").eq("ward_id", ward_id).execute()
    e = e_res.data[0] if e_res.data else {}
    
    v_res = supabase.table("ward_vulnerability").select("*").eq("ward_id", ward_id).execute()
    v = v_res.data[0] if v_res.data else {}
    
    return WardDetailResponse(
        ward_id=w.get("ward_id"),
        ward_name=w.get("ward_name"),
        zone_id=w.get("zone_id"),
        area_km2=w.get("area_km2"),
        population=e.get("population"),
        population_density=e.get("population_density"),
        population_source=e.get("population_source"),
        population_vintage=e.get("population_vintage"),
        healthcare_facility_count=v.get("healthcare_facility_count"),
        healthcare_facilities_per_10000_derived_population=v.get("healthcare_facilities_per_10000_derived_population"),
        vulnerability=v.get("vulnerability"),
        vulnerability_model=v.get("vulnerability_model")
    )

def get_ward_forecast(ward_id: int) -> WardForecastResponse:
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database client unavailable")
        
    w_res = supabase.table("wards").select("ward_id").eq("ward_id", ward_id).execute()
    if not w_res.data:
        raise HTTPException(status_code=404, detail=f"Ward {ward_id} not found")
        
    # Get the risk scores and assigned grid IDs for the ward
    risk_res = supabase.table("ward_forecast_risk").select("*").eq("ward_id", ward_id).execute()
    
    if not risk_res.data:
        return WardForecastResponse(ward_id=ward_id, forecast=[])
        
    # Fetch grid weather data for the assigned grids
    grid_ids = list(set(r.get("assigned_grid_id") for r in risk_res.data))
    grids_res = supabase.table("forecast_grids").select("*").in_("grid_id", grid_ids).execute()
    
    # Map valid_time+grid_id -> weather details
    grid_map = { (g.get("valid_time"), g.get("grid_id")): g for g in grids_res.data }
    
    forecasts = []
    for r in risk_res.data:
        vt = r.get("valid_time")
        gid = r.get("assigned_grid_id")
        g = grid_map.get((vt, gid), {})
        
        # Risk fields override grid fields if any
        forecasts.append(
            ForecastRecord(
                initialization_time=r.get("initialization_time"),
                valid_time=r.get("valid_time"),
                lead_day=g.get("lead_day", 0),
                lead_hours=g.get("lead_hours", 0),
                assigned_grid_id=gid,
                temperature_2m=g.get("temperature_2m"),
                relative_humidity=g.get("relative_humidity"),
                wind_speed_10m=g.get("wind_speed_10m"),
                solar_radiation=g.get("solar_radiation"),
                mean_radiant_temp=g.get("mean_radiant_temp"),
                wbgt_outdoor=g.get("wbgt_outdoor"),
                utci=g.get("utci"),
                heat_index=g.get("heat_index"),
                thermal_hazard_score=g.get("thermal_hazard_score"),
                burden_24h=g.get("burden_24h"),
                burden_72h=g.get("burden_72h"),
                htsi=g.get("htsi"),
                htsi_level=r.get("htsi_level"),
                htsi_label=g.get("htsi_label"),
                human_heat_risk=r.get("human_heat_risk"),
                extreme_utci_flag=r.get("extreme_utci_flag"),
                ward_id=r.get("ward_id")
            )
        )
    
    # Sort by valid_time
    forecasts.sort(key=lambda x: x.valid_time)
        
    return WardForecastResponse(ward_id=ward_id, forecast=forecasts)

def get_forecasts(lead_day: Optional[int], valid_time: Optional[datetime]) -> ForecastListResponse:
    if lead_day is None and valid_time is None:
        raise HTTPException(status_code=400, detail="Must provide at least one filter: lead_day or valid_time")
        
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database client unavailable")
        
    # Build query on grids
    grids_q = supabase.table("forecast_grids").select("*")
    if lead_day is not None:
        grids_q = grids_q.eq("lead_day", lead_day)
    if valid_time is not None:
        vt_str = valid_time.isoformat()
        grids_q = grids_q.eq("valid_time", vt_str)
        
    grids_res = grids_q.execute()
    grids_data = grids_res.data
    
    if not grids_data:
        return ForecastListResponse(forecasts=[], count=0)
        
    grid_ids = list(set(g.get("grid_id") for g in grids_data))
    
    # Build query on risk
    risk_q = supabase.table("ward_forecast_risk").select("*").in_("assigned_grid_id", grid_ids)
    if valid_time is not None:
        vt_str = valid_time.isoformat()
        risk_q = risk_q.eq("valid_time", vt_str)
        
    risk_res = risk_q.execute()
    risk_data = risk_res.data
    
    # We must match grids and risk carefully
    grid_map = { (g.get("valid_time"), g.get("grid_id")): g for g in grids_data }
    
    forecasts = []
    for r in risk_data:
        vt = r.get("valid_time")
        gid = r.get("assigned_grid_id")
        # Check if this valid_time and grid_id was in our grids filter
        g = grid_map.get((vt, gid))
        if g is not None:
            forecasts.append(
                ForecastRecord(
                    initialization_time=r.get("initialization_time"),
                    valid_time=r.get("valid_time"),
                    lead_day=g.get("lead_day", 0),
                    lead_hours=g.get("lead_hours", 0),
                    assigned_grid_id=gid,
                    temperature_2m=g.get("temperature_2m"),
                    relative_humidity=g.get("relative_humidity"),
                    wind_speed_10m=g.get("wind_speed_10m"),
                    solar_radiation=g.get("solar_radiation"),
                    mean_radiant_temp=g.get("mean_radiant_temp"),
                    wbgt_outdoor=g.get("wbgt_outdoor"),
                    utci=g.get("utci"),
                    heat_index=g.get("heat_index"),
                    thermal_hazard_score=g.get("thermal_hazard_score"),
                    burden_24h=g.get("burden_24h"),
                    burden_72h=g.get("burden_72h"),
                    htsi=g.get("htsi"),
                    htsi_level=r.get("htsi_level"),
                    htsi_label=g.get("htsi_label"),
                    human_heat_risk=r.get("human_heat_risk"),
                    extreme_utci_flag=r.get("extreme_utci_flag"),
                    ward_id=r.get("ward_id")
                )
            )
            
    if lead_day is not None and valid_time is not None:
        # User supplied both, let's validate they match by looking at if any results survived.
        # But we already filtered both strictly above.
        pass

    return ForecastListResponse(forecasts=forecasts, count=len(forecasts))

def get_alerts() -> AlertsResponse:
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database client unavailable")
        
    res = supabase.table("ward_alerts").select("*").execute()
    alerts = []
    for r in res.data:
        alerts.append(
            AlertRecord(
                ward_id=r.get("ward_id"),
                start_time=r.get("start_time"),
                end_time=r.get("end_time"),
                peak_time=r.get("peak_time"),
                maximum_alert_level=r.get("maximum_alert_level"),
                peak_htsi=r.get("peak_htsi"),
                peak_utci=r.get("peak_utci"),
                peak_risk=r.get("peak_risk"),
                extreme_utci_flag=r.get("extreme_utci_flag")
            )
        )
    return AlertsResponse(alerts=alerts, count=len(alerts))

def get_horizon() -> HorizonResponse:
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database client unavailable")
        
    grids_res = supabase.table("forecast_grids").select("initialization_time, valid_time, lead_hours, grid_id").execute()
    data = grids_res.data
    
    if not data:
        return HorizonResponse(
            initialization_time=None,
            valid_times=[],
            lead_hours=[],
            number_of_grids=0,
            number_of_wards=0,
            horizon_length_hours=0
        )
        
    init_time = data[0].get("initialization_time")
    valid_times = sorted(list(set(g.get("valid_time") for g in data)))
    lead_hours = sorted(list(set(g.get("lead_hours") for g in data)))
    grids_count = len(set(g.get("grid_id") for g in data))
    
    ward_res = supabase.table("wards").select("ward_id", count="exact").limit(1).execute()
    ward_count = ward_res.count if ward_res.count is not None else 0
    
    max_lead = max(lead_hours) if lead_hours else 0
    
    return HorizonResponse(
        initialization_time=init_time,
        valid_times=valid_times,
        lead_hours=lead_hours,
        number_of_grids=grids_count,
        number_of_wards=ward_count,
        horizon_length_hours=max_lead
    )

from app.models.schemas import (
    ExplanationResponse, ExplanationRisk, ExplanationHeatHazard,
    ExplanationExposure, ExplanationVulnerability, ExplanationDriver
)

def _calc_percentile(target_val: Optional[float], all_vals: List[Optional[float]]) -> Optional[float]:
    if target_val is None:
        return None
    valid_vals = [v for v in all_vals if v is not None]
    if not valid_vals:
        return None
    
    # Simple percentile rank: (number of values <= target_val) / total * 100
    count_less_equal = sum(1 for v in valid_vals if v <= target_val)
    return (count_less_equal / len(valid_vals)) * 100.0

def get_explanation(ward_id: int, lead_day: Optional[int], valid_time: Optional[datetime]) -> ExplanationResponse:
    if lead_day is None and valid_time is None:
        raise HTTPException(status_code=400, detail="Must provide at least one filter: lead_day or valid_time")
        
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database client unavailable")
        
    # Check if ward exists
    ward_res = supabase.table("wards").select("ward_id, ward_name").eq("ward_id", ward_id).execute()
    if not ward_res.data:
        raise HTTPException(status_code=404, detail=f"Ward {ward_id} not found")
    ward_name = ward_res.data[0].get("ward_name")
        
    # Fetch risk record for this ward and time
    risk_q = supabase.table("ward_forecast_risk").select("*").eq("ward_id", ward_id)
    if valid_time:
        risk_q = risk_q.eq("valid_time", valid_time.isoformat())
    # If only lead_day is provided, we must join or rely on the grid to filter
    risk_res = risk_q.execute()
    
    if not risk_res.data:
        raise HTTPException(status_code=404, detail="No forecast record found for this horizon")
        
    # If multiple returned (e.g. lead_day not fully specifying if multiple valid times exist for that day, though unlikely given the schema), pick the first
    # However, ward_forecast_risk doesn't have lead_day. We need to get the grid.
    target_risk = None
    target_grid = None
    
    for r in risk_res.data:
        gid = r.get("assigned_grid_id")
        vt = r.get("valid_time")
        
        # Fetch the grid
        grid_q = supabase.table("forecast_grids").select("*").eq("grid_id", gid).eq("valid_time", vt)
        if lead_day is not None:
            grid_q = grid_q.eq("lead_day", lead_day)
            
        g_res = grid_q.execute()
        if g_res.data:
            target_risk = r
            target_grid = g_res.data[0]
            break
            
    if not target_risk or not target_grid:
        raise HTTPException(status_code=404, detail="No matching grid forecast record found for this horizon")

    # Fetch ALL exposure and vulnerability to compute percentiles
    all_exp_res = supabase.table("ward_exposure").select("ward_id, population, population_density").execute()
    all_vul_res = supabase.table("ward_vulnerability").select("ward_id, vulnerability, healthcare_facility_count, healthcare_facilities_per_10000_derived_population").execute()
    
    all_pop_den = [e.get("population_density") for e in all_exp_res.data]
    all_vul = [v.get("vulnerability") for v in all_vul_res.data]
    all_hc = [v.get("healthcare_facilities_per_10000_derived_population") for v in all_vul_res.data]
    
    # Target ward data
    target_exp = next((e for e in all_exp_res.data if e.get("ward_id") == ward_id), {})
    target_vul = next((v for v in all_vul_res.data if v.get("ward_id") == ward_id), {})
    
    pop_den = target_exp.get("population_density")
    vul = target_vul.get("vulnerability")
    hc = target_vul.get("healthcare_facilities_per_10000_derived_population")
    
    pop_pct = _calc_percentile(pop_den, all_pop_den)
    vul_pct = _calc_percentile(vul, all_vul)
    hc_pct = _calc_percentile(hc, all_hc)
    
    drivers = []
    
    # 1. Heat Hazard Drivers
    htsi_lvl = target_risk.get("htsi_level")
    htsi_lbl = target_grid.get("htsi_label")
    if htsi_lvl is not None and htsi_lvl >= 3:
        lbl_str = htsi_lbl if htsi_lbl else str(htsi_lvl)
        drivers.append(ExplanationDriver(
            category="heat_hazard",
            label="High HTSI level",
            value=target_grid.get("htsi"),
            unit="score",
            description=f"The ward has a project-specific operational HTSI level of {lbl_str}."
        ))
        
    if target_risk.get("extreme_utci_flag"):
        drivers.append(ExplanationDriver(
            category="heat_hazard",
            label="Extreme UTCI",
            value=target_grid.get("utci"),
            unit="°C",
            description="Extreme UTCI flag is true."
        ))
        
    # 2. Exposure Drivers
    if pop_pct is not None and pop_pct >= 80:
        drivers.append(ExplanationDriver(
            category="exposure",
            label="High relative population density",
            value=round(pop_pct, 1),
            unit="percentile",
            description=f"Population density is in the {int(round(pop_pct))}th percentile among current GCC wards."
        ))
        
    # 3. Vulnerability Drivers
    if vul_pct is not None and vul_pct >= 80:
        drivers.append(ExplanationDriver(
            category="vulnerability",
            label="High relative vulnerability",
            value=round(vul_pct, 1),
            unit="percentile",
            description=f"Vulnerability is in the {int(round(vul_pct))}th percentile among current GCC wards."
        ))
        
    if hc_pct is not None and hc_pct <= 20:
        drivers.append(ExplanationDriver(
            category="vulnerability",
            label="Limited healthcare availability",
            value=round(hc_pct, 1),
            unit="percentile",
            description=f"Healthcare availability is in the {int(round(hc_pct))}th percentile among current GCC wards."
        ))

    summary = "This ward's operational heat-impact risk reflects the combination of thermal hazard, population exposure, and vulnerability."
    
    return ExplanationResponse(
        ward_id=ward_id,
        ward_name=ward_name,
        initialization_time=target_risk.get("initialization_time"),
        valid_time=target_risk.get("valid_time"),
        lead_hours=target_grid.get("lead_hours"),
        risk=ExplanationRisk(
            human_heat_risk=target_risk.get("human_heat_risk"),
            heat_hazard=target_risk.get("heat_hazard")
        ),
        heat_hazard=ExplanationHeatHazard(
            htsi=target_grid.get("htsi"),
            htsi_level=target_risk.get("htsi_level"),
            htsi_label=target_grid.get("htsi_label"),
            utci=target_grid.get("utci"),
            wbgt=target_grid.get("wbgt_outdoor"),
            heat_index=target_grid.get("heat_index"),
            tmrt=target_grid.get("mean_radiant_temp"),
            burden_24h=target_grid.get("burden_24h"),
            burden_72h=target_grid.get("burden_72h"),
            extreme_utci_flag=target_risk.get("extreme_utci_flag")
        ),
        exposure=ExplanationExposure(
            population=target_exp.get("population"),
            population_density=pop_den,
            population_density_city_percentile=round(pop_pct, 1) if pop_pct is not None else None
        ),
        vulnerability=ExplanationVulnerability(
            vulnerability=vul,
            vulnerability_city_percentile=round(vul_pct, 1) if vul_pct is not None else None,
            healthcare_facility_count=target_vul.get("healthcare_facility_count"),
            healthcare_facilities_per_10000=hc,
            healthcare_availability_city_percentile=round(hc_pct, 1) if hc_pct is not None else None
        ),
        drivers=drivers,
        summary=summary
    )
