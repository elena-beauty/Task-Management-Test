import pytest
from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient):
    """Test GET / should return service health"""
    response = client.get("/")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "Team Tasks API"
    assert "timestamp" in data

