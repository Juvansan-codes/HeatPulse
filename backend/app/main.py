from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import health, explanation

app = FastAPI(
    title="SIH 2026 Heatwave Early Warning API",
    version="0.1.0",
    description="Backend API for the SIH26083 Human Thermal Stress Index prototype."
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(explanation.router, prefix="/api/v1", tags=["Explainability"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the SIH 2026 Heatwave API"}

