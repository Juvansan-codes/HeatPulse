# Test API Health
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Service is healthy"}
