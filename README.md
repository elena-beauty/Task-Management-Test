# Team Task Platform

Full‑stack application for managing team tasks, built with a FastAPI REST API, React + Vite front‑end, PostgreSQL (via SQLAlchemy), realtime collaboration over Socket.IO, and a small AI helper for suggestions.

## Setup with Docker Compose

Docker Compose is the recommended way to run the entire application stack.

### Quick Start

1. **Clone the repository** (if you haven't already):


2. **Start all services**:
   ```bash
   docker compose up --build
   ```
   ```bash
   docker compose exec back-end python scripts/generate_mock_data.py
   ```


3. **Access the application**:
   - **Web UI**: http://localhost:5173
   - **API Documentation**: http://localhost:5001/docs (Swagger UI)
   - **API ReDoc**: http://localhost:5001/redoc
   - **PostgreSQL**: localhost:5435 (user: `postgres`, password: `postgres`, database: `team_tasks`)

**Run pytest in BackEnd**:
```bash
docker-compose --profile tools run --rm test
```

**Stop services**:
```bash
docker compose stop
```

**Stop and remove containers** (keeps volumes):
```bash
docker compose down
```

### Video demo

1, Introduce system
https://www.loom.com/share/ba8db2852c7a4b9bbf6b51bad86ae4d4

2, Demo feature

https://www.loom.com/share/4923d2e9d984457d8b54f54fa144f04d