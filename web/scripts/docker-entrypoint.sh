#!/bin/sh
set -e

if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  npx prisma migrate deploy --skip-generate
else
  npx prisma db push --skip-generate
fi

exec "$@"