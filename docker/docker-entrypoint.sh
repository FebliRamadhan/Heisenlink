#!/bin/sh
set -e

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
exec node src/server.js
