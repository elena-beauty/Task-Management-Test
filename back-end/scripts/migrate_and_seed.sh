#!/bin/bash
# Script to run migrations and seed data
# Usage: ./scripts/migrate_and_seed.sh [--clear]

set -e

CLEAR_DATA="false"
if [ "$1" == "--clear" ]; then
    CLEAR_DATA="true"
fi

echo "Running database migrations..."
alembic upgrade head

echo ""
echo "Seeding database with mock data..."
CLEAR_DATA=$CLEAR_DATA python scripts/generate_mock_data.py

echo ""
echo "✓ Migration and seeding completed!"

