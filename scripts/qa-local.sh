#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

check() {
  URL="$1"
  echo "Checking $URL"

  STATUS="$(curl -s -o /dev/null -w "%{http_code}" "$URL")"

  if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ] || [ "$STATUS" = "307" ]; then
    echo "OK: $STATUS"
  else
    echo "FAIL: $STATUS"
    exit 1
  fi
}

check "$BASE_URL/"
check "$BASE_URL/pricing"
check "$BASE_URL/login"
check "$BASE_URL/api/health"

echo "Basic QA checks passed."