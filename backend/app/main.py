import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import health, overview, wards, forecast, alerts, explanation

app = FastAPI(
    title="SIH 2026 Heatwave Early Warning API",
    version="0.1.0",
    description="Read-Only Backend API for the SIH26083 Human Thermal Stress Index prototype."
)

# CORS config
frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
origins = [frontend_origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(overview.router, prefix="/api/v1", tags=["Overview"])
app.include_router(wards.router, prefix="/api/v1", tags=["Wards"])
app.include_router(forecast.router, prefix="/api/v1", tags=["Forecast"])
app.include_router(alerts.router, prefix="/api/v1", tags=["Alerts"])
app.include_router(explanation.router, prefix="/api/v1", tags=["Explainability"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the SIH 2026 Heatwave API"}

