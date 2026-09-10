-- SIH 2026: Extreme Heatwave Early Warning & Human Thermal Stress Index
-- Phase 0: Foundation Schema
-- Note: This is a minimal starting point to establish PostGIS and core structures.

-- Enable PostGIS for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Wards: Stores geographical boundaries and basic metadata
CREATE TABLE wards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    geom geometry(Polygon, 4326), -- PostGIS geometry column for ward boundaries
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- IoT Sensor Metadata
CREATE TABLE sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id INTEGER REFERENCES wards(id),
    mac_address VARCHAR(17) UNIQUE,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: Observations, thermal indices, ML results, and warnings will be added in later phases.
