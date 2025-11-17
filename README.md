# Team Task Platform

Full‑stack application for managing team tasks, built with a NestJS REST API, React + Vite front‑end, PostgreSQL (via TypeORM), realtime collaboration over Socket.IO, and a small AI helper for suggestions.

## Project structure

- `back-end`: NestJS API (authentication, teams, todos, AI helper, realtime gateway)
- `front-end`: React + Vite SPA client
- `docker-compose.yml`: Orchestrates Postgres, API, and Web containers

## Running with Docker Compose (recommended)

This is the easiest way to run the whole system (database + API + web UI) with one command.

### 1. Prerequisites

- **Docker** and **Docker Compose** installed
- Internet connection for the first `docker compose up --build` (to pull base images)

### 2. Environment configuration

Each app ships with an `.env.example`:

| Service | Example file | What you need to do |
|---------|--------------|---------------------|
| API     | `back-end/.env.example`   | Copy to `back-end/.env` and optionally adjust DB name / JWT secrets |
| Web     | `front-end/.env.example`  | Copy to `front-end/.env` and optionally adjust `VITE_API_URL` / `VITE_WS_URL` |

> When running via Docker Compose, you can usually keep the defaults; the compose file wires services together on the same Docker network.

From the repository root:

```bash
docker compose up --build
```

On first run:

- The **API container** installs dependencies, runs TypeORM **migrations**, then starts on `http://localhost:3000`.
- The **seed script** runs automatically (via container entrypoint) to create demo data, including a default user `owner@example.com` / `Passw0rd!` (if not already present).
- The **front-end container** builds the React app and serves it via Nginx on `http://localhost:5173`.

Once all containers are healthy, open the app in your browser:

- **Web UI**: `http://localhost:5173`
- **API** (for manual testing): `http://localhost:3000`

To stop and clean up containers and volumes:

```bash
docker compose down -v
```


## Helpful scripts

| Location   | Script                   | Description                         |
|-----------|--------------------------|-------------------------------------|
| `back-end`  | `docker-compose exec back-end npm run migration:run` | Applies TypeORM migrations via ts-node |
| `back-end-test`  | `docker compose exec back-end npm run test:e2e`         | Run test Jest             |
| `front-end` | `npm run dev`          | Starts the Vite dev server          |
| root        | `docker compose up --build` | Boots Postgres + API + Web stack |

