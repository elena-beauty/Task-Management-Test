import pytest
from fastapi.testclient import TestClient


def test_get_notifications_should_list_notifications_for_user(client: TestClient, auth_headers):
    """Test GET /api/notifications should list notifications for the user"""
    response = client.get("/api/notifications", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

