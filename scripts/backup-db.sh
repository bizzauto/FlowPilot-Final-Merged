#!/usr/bin/env bash
set -euo pipefail

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-flowpilot}"
POSTGRES_DB="${POSTGRES_DB:-flowpilot}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%F_%H-%M-%S)"
FILE="$BACKUP_DIR/flowpilot_${TIMESTAMP}.sql.gz"

echo "Creating backup..."

docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILE"

echo "Backup created:"
echo "$FILE"