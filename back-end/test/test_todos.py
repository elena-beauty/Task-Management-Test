import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def team_id(client: TestClient, auth_headers):
    """Create a team for todo tests"""
    response = client.post(
        "/api/teams",
        headers=auth_headers,
        json={
            "name": "Todos E2E Team",
            "description": "Team used for todos e2e tests",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


@pytest.fixture
def todo_id(client: TestClient, auth_headers, team_id):
    """Create a todo and return its ID"""
    response = client.post(
        "/api/todos",
        headers=auth_headers,
        json={
            "title": "Todos e2e todo",
            "description": "This is a test todo created via todos e2e tests",
            "team_id": team_id,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_create_todo_should_create_todo_in_team(client: TestClient, auth_headers, team_id, todo_id):
    """Test POST /api/todos should create a todo in the team"""
    # Todo is created in fixture, just verify it exists
    assert todo_id is not None


def test_get_todos_should_list_todos_for_team(client: TestClient, auth_headers, team_id, todo_id):
    """Test GET /api/todos should list todos for the team"""
    response = client.get(
        "/api/todos",
        headers=auth_headers,
        params={"teamId": str(team_id)},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_todo_should_return_single_todo(client: TestClient, auth_headers, todo_id):
    """Test GET /api/todos/:id should return a single todo"""
    response = client.get(f"/api/todos/{todo_id}", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == todo_id


def test_update_todo_should_update_todo(client: TestClient, auth_headers, todo_id):
    """Test PATCH /api/todos/:id should update a todo"""
    response = client.patch(
        f"/api/todos/{todo_id}",
        headers=auth_headers,
        json={
            "title": "Todos e2e updated",
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == todo_id
    assert data["title"] == "Todos e2e updated"


def test_delete_todo_should_delete_todo(client: TestClient, auth_headers, todo_id):
    """Test DELETE /api/todos/:id should delete a todo"""
    response = client.delete(f"/api/todos/{todo_id}", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["deleted"] is True

