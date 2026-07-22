#!/usr/bin/env bash
set -euo pipefail

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-flowpilot}"
POSTGRES_DB="${POSTGRES_DB:-flowpilot}"

FILE="${1:-}"

if [ -z "$FILE" ]; then
  echo "Usage: ./scripts/restore-db.sh ./backups/flowpilot_FILE.sql.gz"
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE"
  exit 1
fi

echo "Restoring from $FILE..."

gunzip -c "$FILE" | docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "Restore complete."