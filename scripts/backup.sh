#!/bin/bash

# LinkHub Database Backup Script
# Usage: ./backup.sh

# Load environment variables
if [ -f ../.env ]; then
  export $(cat ../.env | grep -v '#' | awk '/=/ {print $1}')
fi

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/linkhub_backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Extract DB connection details
# Assumes DATABASE_URL format: postgres://user:pass@host:port/dbname
DB_URI=${DATABASE_URL}

echo "Starting backup to $BACKUP_FILE..."

# Perform dump using docker exec if running in container, or pg_dump locally
if docker compose ps | grep -q "postgres"; then
    echo "Using Docker container for backup..."
    # You might need to adjust container name based on your docker-compose
    docker compose exec -T postgres pg_dump "$DB_URI" > "$BACKUP_FILE"
else
    echo "Using local pg_dump..."
    pg_dump "$DB_URI" > "$BACKUP_FILE"
fi

# Rotate backups (keep last 7 days)
find "$BACKUP_DIR" -name "linkhub_backup_*.sql" -mtime +7 -delete

echo "Backup complete: $BACKUP_FILE"
