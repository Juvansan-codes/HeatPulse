# SIH 2026: Extreme Heatwave Early Warning & Human Thermal Stress Index

Prototype for Smart India Hackathon 2026 (Problem Statement: SIH26083).

## Stack

- **Backend:** FastAPI, Python
- **Frontend:** Next.js, Tailwind CSS
- **Database:** Supabase (PostgreSQL, PostGIS)
- **Mobile:** Flutter
- **IoT:** Arduino UNO R4 WiFi

## Setup

See individual component directories for setup instructions.

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```
