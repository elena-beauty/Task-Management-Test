# Test Suite

This directory contains pytest-based end-to-end tests for the Team Tasks API.

## Running Tests

### Using Docker Compose (Recommended)

#### Run all tests:
```bash
docker-compose --profile tools run --rm test
```

#### Run specific test file:
```bash
docker-compose --profile tools run --rm test pytest test/test_auth.py
```

#### Run with verbose output:
```bash
docker-compose --profile tools run --rm test pytest -v
```

#### Run with coverage:
```bash
docker-compose --profile tools run --rm test pytest --cov=app --cov-report=html
```

#### Run specific test function:
```bash
docker-compose --profile tools run --rm test pytest test/test_auth.py::test_register_user
```

#### Run tests matching a pattern:
```bash
docker-compose --profile tools run --rm test pytest -k "auth"
```

### Running Tests Locally

#### Run all tests:
```bash
pytest
```

#### Run specific test file:
```bash
pytest test/test_auth.py
```

#### Run with verbose output:
```bash
pytest -v
```

#### Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

## Test Structure

- `conftest.py` - Shared pytest fixtures (database, test client, auth headers)
- `test_root.py` - Root endpoint tests
- `test_auth.py` - Authentication tests (register, login, me)
- `test_teams.py` - Team management tests
- `test_todos.py` - Todo CRUD tests
- `test_notifications.py` - Notification tests
- `test_ai.py` - AI suggestion tests

## Test Database

Tests use an in-memory SQLite database that is created and destroyed for each test function. This ensures test isolation and fast execution.

## Fixtures

- `db_session` - Database session for each test
- `client` - FastAPI TestClient with database override
- `auth_headers` - Authentication headers with valid JWT token
- `team_id` - Pre-created team ID (in team/todo tests)
- `todo_id` - Pre-created todo ID (in todo tests)

