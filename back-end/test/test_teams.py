import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def team_id(client: TestClient, auth_headers):
    """Create a team and return its ID"""
    response = client.post(
        "/api/teams",
        headers=auth_headers,
        json={
            "name": "E2E Teams Test",
            "description": "Team created during teams e2e tests",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_create_team_should_create_new_team_for_user(client: TestClient, auth_headers, team_id):
    """Test POST /api/teams should create a new team for the user"""
    # Team is created in fixture, just verify it exists
    assert team_id is not None


def test_get_teams_should_list_teams_for_authenticated_user(client: TestClient, auth_headers, team_id):
    """Test GET /api/teams should list teams for the authenticated user"""
    response = client.get("/api/teams", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_team_members_should_list_team_members(client: TestClient, auth_headers, team_id):
    """Test GET /api/teams/:teamId/members should list team members"""
    response = client.get(f"/api/teams/{team_id}/members", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_add_team_member_should_add_member(client: TestClient, auth_headers, team_id):
    """Test POST /api/teams/:teamId/members should add a team member"""
    response = client.post(
        f"/api/teams/{team_id}/members",
        headers=auth_headers,
        json={
            "email": f"teams-member+{pytest.current_time}@example.com",
            "name": "Teams Member",
        },
    )
    
    # Accept both 200 and 201 status codes
    assert response.status_code in [200, 201]
    data = response.json()
    assert "id" in data


def test_invite_team_member_should_invite_member(client: TestClient, auth_headers, team_id):
    """Test POST /api/teams/:teamId/invite should invite a team member"""
    response = client.post(
        f"/api/teams/{team_id}/invite",
        headers=auth_headers,
        json={
            "email": f"teams-invite+{pytest.current_time}@example.com",
            "name": "Teams Invitee",
        },
    )
    
    # Accept both 200 and 201 status codes
    assert response.status_code in [200, 201]
    data = response.json()
    assert "id" in data

