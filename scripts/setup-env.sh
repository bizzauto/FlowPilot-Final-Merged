#!/usr/bin/env bash
set -euo pipefail

if [ -f .env ]; then
  echo ".env already exists."
  exit 0
fi

if [ ! -f .env.example ]; then
  echo ".env.example not found."
  exit 1
fi

cp .env.example .env

generate() {
  openssl rand -hex 24
}

POSTGRES_SECRET="$(generate)"
REDIS_SECRET="$(generate)"
NEXTAUTH_SECRET="$(generate)"
N8N_KEY="$(generate)"
SHARED_SECRET="$(generate)"
VERIFY_TOKEN="$(generate)"

sed -i.bak "s/change_me_super_secret/${POSTGRES_SECRET}/g" .env
sed -i.bak "s/change_me_redis_secret/${REDIS_SECRET}/g" .env
sed -i.bak "s/change_me_nextauth_secret/${NEXTAUTH_SECRET}/g" .env
sed -i.bak "s/change_me_n8n_encryption_key/${N8N_KEY}/g" .env
sed -i.bak "s/change_me_shared_secret/${SHARED_SECRET}/g" .env
sed -i.bak "s/change_me_verify_token/${VERIFY_TOKEN}/g" .env

rm -f .env.bak

echo ".env created with generated secrets."