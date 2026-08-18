#!/bin/sh
set -e

echo "Running migrations..."
pnpm --filter @marklabs/database prisma migrate deploy

echo "Starting application..."
exec "$@"
