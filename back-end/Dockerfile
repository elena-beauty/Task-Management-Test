FROM python:3.11-slim AS base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM base AS development
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
COPY . .
EXPOSE 5001
CMD ["sh", "-c", "until alembic upgrade head; do echo 'Migration failed, retrying in 2 seconds...'; sleep 2; done && uvicorn main:socket_app --host 0.0.0.0 --port 5001 --reload"]

FROM base AS production
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
COPY . .
EXPOSE 5001
CMD ["sh", "-c", "until alembic upgrade head; do echo 'Migration failed, retrying in 2 seconds...'; sleep 2; done && uvicorn main:socket_app --host 0.0.0.0 --port 5001"]
