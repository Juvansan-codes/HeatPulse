-- SIH 2026: Extreme Heatwave Early Warning & Human Thermal Stress Index
-- Phase 4.5.1: Production Serving Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- Required for gen_random_uuid()

-- ==================================================
-- 1. UPGRADE EXISTING wards TABLE
-- ==================================================
-- The existing Phase 0 `wards` table remains the authoritative spatial backbone.
-- Renaming 'id' to 'ward_id' will seamlessly cascade to the foreign key in `sensors`.
ALTER TABLE wards RENAME COLUMN id TO ward_id;
ALTER TABLE wards RENAME COLUMN name TO ward_name;

-- Add new GIS-derived columns. Existing columns (city, created_at) are preserved.
ALTER TABLE wards ADD COLUMN IF NOT EXISTS zone_id VARCHAR;
ALTER TABLE wards ADD COLUMN IF NOT EXISTS area_km2 DOUBLE PRECISION;

-- PostGIS GiST index enables efficient point-in-polygon ward lookup (ST_Covers).
CREATE INDEX IF NOT EXISTS idx_wards_geom ON wards USING GiST (geom);

-- ==================================================
-- 2. CREATE ward_exposure
-- ==================================================
CREATE TABLE IF NOT EXISTS ward_exposure (
    ward_id INTEGER PRIMARY KEY REFERENCES wards(ward_id),
    population DOUBLE PRECISION CHECK (population >= 0),
    population_density DOUBLE PRECISION CHECK (population_density >= 0),
    population_source VARCHAR,
    population_method TEXT,
    population_vintage INTEGER,
    population_is_derived BOOLEAN,
    population_confidence VARCHAR
);

-- ==================================================
-- 3. CREATE ward_vulnerability
-- ==================================================
CREATE TABLE IF NOT EXISTS ward_vulnerability (
    ward_id INTEGER PRIMARY KEY REFERENCES wards(ward_id),
    healthcare_facility_count INTEGER CHECK (healthcare_facility_count >= 0),
    healthcare_facilities_per_10000_derived_population DOUBLE PRECISION CHECK (healthcare_facilities_per_10000_derived_population >= 0),
    population_density_sensitivity DOUBLE PRECISION,
    healthcare_access_capacity DOUBLE PRECISION,
    vulnerability DOUBLE PRECISION CHECK (vulnerability >= 0 AND vulnerability <= 1),
    healthcare_confidence VARCHAR,
    vulnerability_model VARCHAR,
    vulnerability_confidence VARCHAR,
    omitted_variables TEXT
);

-- ==================================================
-- 4. CREATE forecast_grids
-- ==================================================
-- This grid-level table stores raw and thermal indicators derived directly from 
-- the ML pipeline. The 12.8,80.2 grid must be included here even if no wards map to it.
CREATE TABLE IF NOT EXISTS forecast_grids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_id VARCHAR NOT NULL,
    initialization_time TIMESTAMPTZ NOT NULL,
    valid_time TIMESTAMPTZ NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    lead_day INTEGER,
    lead_hours INTEGER,
    temperature_2m DOUBLE PRECISION,
    relative_humidity DOUBLE PRECISION CHECK (relative_humidity >= 0 AND relative_humidity <= 100),
    wind_speed_10m DOUBLE PRECISION CHECK (wind_speed_10m >= 0),
    solar_radiation DOUBLE PRECISION CHECK (solar_radiation >= 0),
    mean_radiant_temp DOUBLE PRECISION,
    wbgt_outdoor DOUBLE PRECISION,
    utci DOUBLE PRECISION,
    heat_index DOUBLE PRECISION,
    thermal_hazard_score DOUBLE PRECISION,
    burden_24h DOUBLE PRECISION,
    burden_72h DOUBLE PRECISION,
    htsi DOUBLE PRECISION CHECK (htsi >= 0 AND htsi <= 100),
    htsi_level INTEGER CHECK (htsi_level >= 0 AND htsi_level <= 4),
    htsi_label VARCHAR,
    extreme_utci_flag BOOLEAN,
    UNIQUE (initialization_time, valid_time, grid_id)
);

CREATE INDEX IF NOT EXISTS idx_forecast_grids_valid_grid ON forecast_grids (valid_time, grid_id);
CREATE INDEX IF NOT EXISTS idx_forecast_grids_init ON forecast_grids (initialization_time);

-- ==================================================
-- 5. CREATE ward_forecast_risk
-- ==================================================
-- Captures the unified human heat risk tailored directly to the ward.
CREATE TABLE IF NOT EXISTS ward_forecast_risk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initialization_time TIMESTAMPTZ NOT NULL,
    valid_time TIMESTAMPTZ NOT NULL,
    ward_id INTEGER NOT NULL REFERENCES wards(ward_id),
    assigned_grid_id VARCHAR,
    htsi_level INTEGER CHECK (htsi_level >= 0 AND htsi_level <= 4),
    heat_hazard DOUBLE PRECISION CHECK (heat_hazard >= 0),
    human_heat_risk DOUBLE PRECISION CHECK (human_heat_risk >= 0),
    extreme_utci_flag BOOLEAN,
    UNIQUE (initialization_time, valid_time, ward_id)
);

-- Note on indexes: (valid_time, ward_id) is ideal for city-wide maps at time T.
-- (ward_id, valid_time) is ideal for a specific ward's timeline chart across T. 
-- Both access patterns are standard for the dashboard, so both are justified.
CREATE INDEX IF NOT EXISTS idx_ward_risk_valid_ward ON ward_forecast_risk (valid_time, ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_risk_ward_valid ON ward_forecast_risk (ward_id, valid_time);

-- ==================================================
-- 6. CREATE ward_alerts
-- ==================================================
CREATE TABLE IF NOT EXISTS ward_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initialization_time TIMESTAMPTZ NOT NULL,
    ward_id INTEGER NOT NULL REFERENCES wards(ward_id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    peak_time TIMESTAMPTZ,
    maximum_alert_level INTEGER CHECK (maximum_alert_level >= 0 AND maximum_alert_level <= 4),
    peak_htsi DOUBLE PRECISION CHECK (peak_htsi >= 0 AND peak_htsi <= 100),
    peak_utci DOUBLE PRECISION,
    peak_risk DOUBLE PRECISION CHECK (peak_risk >= 0),
    extreme_utci_flag BOOLEAN,
    UNIQUE (ward_id, start_time)
);

-- Safety documentation for UNIQUE(ward_id, start_time):
-- Since the production serving database is strictly governed by a "latest-operational-window" 
-- retention policy, duplicate alerts from successive initializations are upserted.
-- If a newer forecast maintains the same onset (start_time) for a ward, 
-- the upsert will seamlessly overwrite the peak severities and duration, 
-- updating the event identity with the new `initialization_time` without inflating rows.

-- Index for scanning currently active alerts across all wards:
CREATE INDEX IF NOT EXISTS idx_ward_alerts_active ON ward_alerts (start_time, end_time);
-- Index for retrieving the alert history of a specific ward:
CREATE INDEX IF NOT EXISTS idx_ward_alerts_ward_time ON ward_alerts (ward_id, start_time, end_time);
