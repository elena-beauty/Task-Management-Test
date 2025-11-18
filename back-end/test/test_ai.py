import pytest
from fastapi.testclient import TestClient


def test_ai_suggestions_should_return_suggestion_or_fallback(client: TestClient, auth_headers):
    """Test POST /api/ai/suggestions should return an AI suggestion or heuristic fallback"""
    response = client.post(
        "/api/ai/suggestions",
        headers=auth_headers,
        json={
            "prompt": "Plan sprint tasks for this week",
            "team_context": "frontend team focusing on UI polish",
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "title_suggestion" in data
    assert "description_suggestion" in data
    assert "recommended_status" in data
    assert "confidence" in data
    assert "reasoning" in data

