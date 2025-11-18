# Team Tasks API - FastAPI Backend

A FastAPI-based backend for team task management with AI assistance, real-time updates, and comprehensive API documentation.

## Features

- **FastAPI** with automatic OpenAPI/Swagger documentation
- **SQLAlchemy** ORM for database models
- **Pydantic** for request/response validation
- **JWT Authentication** with secure password hashing
- **WebSocket** support for real-time updates (Socket.IO)
- **Alembic** for database migrations
- **PostgreSQL** database
- **Google AI Integration** for AI task suggestions

## Tech Stack

- Python 3.11+
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic
- PostgreSQL
- Socket.IO
- Google AI (optional)

## Setup

### Prerequisites

- Python 3.11 or higher
- PostgreSQL database
- (Optional) Google AI API key for AI features

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables (create a `.env` file):
```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5435
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=team_tasks

# JWT
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Google AI (optional)
GOOGLE_API_KEY=your-google-api-key
GOOGLE_MODEL=gemini-1.5-flash

# Server
PORT=3000
DEBUG=True

# Frontend
FRONTEND_URL=http://localhost:5173
```

3. Run database migrations:
```bash
alembic upgrade head
```

4. Start the development server:
```bash
uvicorn main:socket_app --host 0.0.0.0 --port 3000 --reload
```

## API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc
- **OpenAPI JSON**: http://localhost:3000/openapi.json

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (protected)

### Teams
- `GET /api/teams` - Get all teams for current user (protected)
- `POST /api/teams` - Create a new team (protected)
- `GET /api/teams/{team_id}/members` - Get team members (protected)
- `POST /api/teams/{team_id}/members` - Add team member (protected)
- `POST /api/teams/{team_id}/invite` - Invite team member (protected)

### Todos
- `GET /api/todos?teamId={team_id}` - Get todos for a team (protected)
- `POST /api/todos` - Create a new todo (protected)
- `GET /api/todos/{id}` - Get a single todo (protected)
- `PATCH /api/todos/{id}` - Update a todo (protected)
- `DELETE /api/todos/{id}` - Delete a todo (protected)

### Notifications
- `GET /api/notifications` - List notifications for current user (protected)

### AI
- `POST /api/ai/suggestions` - Get AI task suggestion (protected)

## WebSocket

The API includes WebSocket support via Socket.IO for real-time updates:

- Connect to: `ws://localhost:3000/socket.io/`
- Namespace: `/collab`
- Authentication: Include JWT token in `auth.token` or `Authorization` header

Events:
- `joinTeam` - Join a team room for real-time updates
- `todo.created` - Broadcasted when a todo is created
- `todo.updated` - Broadcasted when a todo is updated
- `todo.deleted` - Broadcasted when a todo is deleted
- `notification.created` - Broadcasted when a notification is created

## Database Migrations

### Create a new migration:
```bash
alembic revision --autogenerate -m "description"
```

### Apply migrations:
```bash
alembic upgrade head
```

### Rollback migration:
```bash
alembic downgrade -1
```

## Docker & Docker Compose

### Using Docker Compose (Recommended)

1. **Start all services:**
```bash
docker-compose up -d
```

2. **Run migrations only:**
```bash
docker-compose --profile tools run --rm migrate
```

3. **Seed data only (keeps existing data):**
```bash
docker-compose --profile tools run --rm seed
```

4. **Seed data (clears existing data first):**
```bash
docker-compose --profile tools run --rm -e CLEAR_DATA=true seed
```

5. **Run migrations and seed data together:**
```bash
docker-compose --profile tools run --rm migrate-and-seed
```

6. **Run migrations and seed data (clearing existing data):**
```bash
docker-compose --profile tools run --rm -e CLEAR_DATA=true migrate-and-seed
```

### Alternative: Run commands directly in container

**Run migrations:**
```bash
docker-compose exec back-end alembic upgrade head
```

**Generate seed data:**
```bash
docker-compose exec back-end python scripts/generate_mock_data.py
```

**Run both (using helper script):**
```bash
docker-compose exec back-end bash scripts/migrate_and_seed.sh
docker-compose exec back-end bash scripts/migrate_and_seed.sh --clear
```

### Standalone Docker

Build and run with Docker:

```bash
docker build -t team-tasks-api .
docker run -p 3000:3000 team-tasks-api
```

## Project Structure

```
back-end/
├── alembic/              # Database migrations
├── app/
│   ├── api/             # API routes
│   │   └── v1/
│   │       ├── endpoints/  # Route handlers
│   │       └── api.py
│   ├── core/            # Core configuration
│   │   ├── config.py   # Settings
│   │   ├── database.py # Database setup
│   │   ├── security.py # JWT & password hashing
│   │   └── dependencies.py # FastAPI dependencies
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   ├── services/       # Business logic
│   └── realtime/       # WebSocket gateway
├── main.py             # Application entry point
├── requirements.txt    # Python dependencies
└── alembic.ini         # Alembic configuration
```

## Validation

All request/response validation is handled by Pydantic models in `app/schemas/`. The models automatically:
- Validate data types
- Enforce constraints (min/max length, email format, etc.)
- Generate OpenAPI documentation
- Provide clear error messages

## License

UNLICENSED
