# Mobile API Contract

This document outlines the REST API contract that the Flutter mobile application will consume from the FastAPI backend.

## Base URL
`https://api.yourdomain.com/api/v1`

## Endpoints (Draft)

### GET `/health`
- **Description:** System health check.
- **Response:** `200 OK` `{"status": "ok", "message": "Service is healthy"}`

*(Further endpoints for ward data, current conditions, forecasts, and warnings will be added in subsequent phases.)*
