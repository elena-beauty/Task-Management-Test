# Scripts

## Generate Mock Data

The `generate_mock_data.py` script generates realistic mock data for all tables in the database.

### Generated Data

- **Users**: 20 users with default password `password123`
- **Teams**: 10 teams with random owners
- **Team Memberships**: 2-5 members per team (including owners)
- **Todos**: 50 todos with various statuses and assignees
- **Notifications**: 30 notifications with different types

### Usage

#### In Docker (Recommended)

**Option 1: Using docker-compose service (with profile)**
```bash
# Generate mock data (keeps existing data)
docker-compose --profile tools run --rm seed

# Clear all existing data and generate new mock data
docker-compose --profile tools run --rm -e CLEAR_DATA=true seed

# Run migrations and seed data together
docker-compose --profile tools run --rm migrate-and-seed

# Run migrations and seed data (clearing existing data)
docker-compose --profile tools run --rm -e CLEAR_DATA=true migrate-and-seed
```

**Option 2: Running directly in back-end container**
```bash
# Generate mock data (keeps existing data)
docker-compose exec back-end python scripts/generate_mock_data.py

# Clear all existing data and generate new mock data
docker-compose exec back-end bash -c "CLEAR_DATA=true python scripts/generate_mock_data.py"
```

#### Locally

```bash
# Make sure you have the environment set up and database is running
python scripts/generate_mock_data.py

# Clear existing data first
CLEAR_DATA=true python scripts/generate_mock_data.py
```

## Migrate and Seed

The `migrate_and_seed.sh` script runs both migrations and seed data generation.

### Usage

```bash
# In Docker container
docker-compose exec back-end bash scripts/migrate_and_seed.sh

# Clear data and reseed
docker-compose exec back-end bash scripts/migrate_and_seed.sh --clear

# Locally
bash scripts/migrate_and_seed.sh
bash scripts/migrate_and_seed.sh --clear
```

### Environment Variables

- `CLEAR_DATA`: Set to `"true"` to clear all existing data before generating new data (default: `"false"`)

### Notes

- All generated users have the password: `password123`
- The script uses Faker to generate realistic data
- Data is generated with proper relationships (users in teams, todos assigned to users, etc.)
- Migrations run automatically when the back-end container starts, but you can also run them manually
