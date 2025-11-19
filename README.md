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

3. **Access the application**:
   - **Web UI**: http://localhost:5173
   - **API Documentation**: http://localhost:5001/docs (Swagger UI)
   - **API ReDoc**: http://localhost:5001/redoc
   - **PostgreSQL**: localhost:5435 (user: `postgres`, password: `postgres`, database: `team_tasks`)

### What Happens on First Run

1. **PostgreSQL Container**:
   - Creates database `team_tasks`
   - Exposes port `5435` (mapped from container port `5432`)
   - Creates persistent volume `pgdata` for data storage

2. **Backend Container**:
   - Installs Python dependencies from `requirements.txt`
   - Runs Alembic migrations automatically (`alembic upgrade head`)
   - Starts FastAPI server with auto-reload on port `5001`
   - Connects to PostgreSQL using Docker service name `postgres`

3. **Frontend Container**:
   - Installs Node.js dependencies
   - Starts Vite development server on port `5173`
   - Hot-reloads on code changes (volume mounted)

### Environment Configuration

The `docker-compose.yml` file includes default environment variables. For production, you may want to customize:

**Backend Environment Variables** (in `docker-compose.yml`):
- `POSTGRES_HOST`: Database hostname (default: `postgres`)
- `POSTGRES_DB`: Database name (default: `team_tasks`)
- `POSTGRES_USER`: Database user (default: `postgres`)
- `POSTGRES_PASSWORD`: Database password (default: `postgres`)
- `JWT_SECRET`: Secret key for JWT tokens (⚠️ **change in production**)
- `JWT_EXPIRATION_HOURS`: Token expiration time (default: `24`)
- `PORT`: Backend server port (default: `5001`)
- `GOOGLE_API_KEY`: Optional Google AI API key for AI features

**Frontend Environment Variables**:
- The frontend connects to backend via Docker service names
- In development mode, no `.env` file is required (uses defaults)

### Useful Docker Compose Commands

**Start services in detached mode** (background):
```bash
docker compose up -d --build
```

**View logs**:
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f back-end
docker compose logs -f front-end
docker compose logs -f postgres
```

**Stop services**:
```bash
docker compose stop
```

**Stop and remove containers** (keeps volumes):
```bash
docker compose down
```

**Stop and remove containers and volumes** (⚠️ **deletes database data**):
```bash
docker compose down -v
```

**Rebuild specific service**:
```bash
docker compose up --build back-end
docker compose up --build front-end
```

**Execute commands in running containers**:
```bash
# Access backend shell
docker compose exec back-end bash

# Run migrations manually
docker compose exec back-end alembic upgrade head

# Run seed script
docker compose exec back-end python scripts/generate_mock_data.py
```

### Database Management

**Run migrations only**:
```bash
docker compose --profile tools run --rm migrate
```

**Seed database with mock data**:
```bash
docker compose --profile tools run --rm seed
```

**Run migrations and seed together**:
```bash
docker compose --profile tools run --rm migrate-and-seed
```

**Clear existing data and reseed**:
```bash
docker compose --profile tools run --rm -e CLEAR_DATA=true migrate-and-seed
```

### Running Tests

**Run backend tests**:
```bash
docker compose --profile tools run --rm test
```

### Troubleshooting

**Port already in use**:
- Change port mappings in `docker-compose.yml` if ports `5001`, `5173`, or `5435` are already in use

**Database connection errors**:
- Ensure PostgreSQL container is healthy: `docker compose ps`
- Check backend logs: `docker compose logs back-end`
- Verify database is ready: `docker compose exec postgres pg_isready -U postgres`

**Frontend can't connect to backend**:
- Ensure both containers are on the same Docker network
- Check that backend is running: `docker compose ps`
- Verify backend URL in frontend environment variables

**Reset everything**:
```bash
docker compose down -v
docker compose up --build
```


## Additional Resources

### API Documentation

Once the backend is running, you can access:
- **Swagger UI**: http://localhost:5001/docs - Interactive API documentation


### Default Test Credentials

After seeding the database, you can use:
- **Email**: `owner@example.com`
- **Password**: `password123`

### Development Workflow

1. **Start services**: `docker compose up --build`
2. **Make code changes**: Files are volume-mounted, so changes reflect immediately
3. **Backend auto-reloads**: FastAPI detects Python file changes
4. **Frontend hot-reloads**: Vite automatically refreshes the browser
5. **View logs**: `docker compose logs -f` to monitor all services

### Project Features

- ✅ User authentication (JWT-based)
- ✅ Team management (create teams, invite members)
- ✅ Todo CRUD operations task and team
- ✅ Real-time updates via Socket.IO
- ✅ AI-powered task suggestions
- ✅ Notifications system
- ✅ Role-based permissions (team owners)

