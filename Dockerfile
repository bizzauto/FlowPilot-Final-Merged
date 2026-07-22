services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-flowpilot}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-flowpilot123}
      POSTGRES_DB: ${POSTGRES_DB:-flowpilot}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres-init.sh:/docker-entrypoint-initdb.d/postgres-init.sh
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-flowpilot} -d ${POSTGRES_DB:-flowpilot}"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - flowpilot

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD:-flowpilot123}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-flowpilot123}", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - flowpilot

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000

      DATABASE_URL: ${DATABASE_URL:-postgresql://flowpilot:flowpilot123@postgres:5432/flowpilot?schema=public}
      REDIS_URL: ${REDIS_URL:-redis://:flowpilot123@redis:6379}

      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:-change_me_nextauth_secret}

      DEFAULT_ORGANIZATION_ID: ${DEFAULT_ORGANIZATION_ID:-}

      WHATSAPP_PROVIDER: ${WHATSAPP_PROVIDER:-EVOLUTION}

      WHATSAPP_PHONE_NUMBER_ID: ${WHATSAPP_PHONE_NUMBER_ID:-}
      WHATSAPP_ACCESS_TOKEN: ${WHATSAPP_ACCESS_TOKEN:-}
      WHATSAPP_VERIFY_TOKEN: ${WHATSAPP_VERIFY_TOKEN:-flowpilot_verify_token}
      WHATSAPP_APP_SECRET: ${WHATSAPP_APP_SECRET:-}

      EVOLUTION_API_URL: ${EVOLUTION_API_URL:-http://evolution:8080}
      EVOLUTION_API_KEY: ${EVOLUTION_API_KEY:-change_me_evolution_key}
      EVOLUTION_INSTANCE: ${EVOLUTION_INSTANCE:-flowpilot}
      EVOLUTION_WEBHOOK_SECRET: ${EVOLUTION_WEBHOOK_SECRET:-}

      LEAD_WEBHOOK_TOKEN: ${LEAD_WEBHOOK_TOKEN:-}

      RESEND_API_KEY: ${RESEND_API_KEY:-}
      EMAIL_FROM: ${EMAIL_FROM:-FlowPilot <hello@yourdomain.com>}

      SENTRY_DSN: ${SENTRY_DSN:-}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    ports:
      - "${WEB_PORT:-3000}:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s
    networks:
      - flowpilot

  message-worker:
    build:
      context: ./web
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL:-postgresql://flowpilot:flowpilot123@postgres:5432/flowpilot?schema=public}
      REDIS_URL: ${REDIS_URL:-redis://:flowpilot123@redis:6379}

      WHATSAPP_PROVIDER: ${WHATSAPP_PROVIDER:-EVOLUTION}
      WHATSAPP_PHONE_NUMBER_ID: ${WHATSAPP_PHONE_NUMBER_ID:-}
      WHATSAPP_ACCESS_TOKEN: ${WHATSAPP_ACCESS_TOKEN:-}

      EVOLUTION_API_URL: ${EVOLUTION_API_URL:-http://evolution:8080}
      EVOLUTION_API_KEY: ${EVOLUTION_API_KEY:-change_me_evolution_key}
      EVOLUTION_INSTANCE: ${EVOLUTION_INSTANCE:-flowpilot}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npx tsx workers/message-worker.ts
    networks:
      - flowpilot

  campaign-worker:
    build:
      context: ./web
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL:-postgresql://flowpilot:flowpilot123@postgres:5432/flowpilot?schema=public}
      REDIS_URL: ${REDIS_URL:-redis://:flowpilot123@redis:6379}

      WHATSAPP_PROVIDER: ${WHATSAPP_PROVIDER:-EVOLUTION}
      WHATSAPP_PHONE_NUMBER_ID: ${WHATSAPP_PHONE_NUMBER_ID:-}
      WHATSAPP_ACCESS_TOKEN: ${WHATSAPP_ACCESS_TOKEN:-}

      EVOLUTION_API_URL: ${EVOLUTION_API_URL:-http://evolution:8080}
      EVOLUTION_API_KEY: ${EVOLUTION_API_KEY:-change_me_evolution_key}
      EVOLUTION_INSTANCE: ${EVOLUTION_INSTANCE:-flowpilot}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npx tsx workers/campaign-worker.ts
    networks:
      - flowpilot

  automation-worker:
    build:
      context: ./web
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL:-postgresql://flowpilot:flowpilot123@postgres:5432/flowpilot?schema=public}
      REDIS_URL: ${REDIS_URL:-redis://:flowpilot123@redis:6379}

      WHATSAPP_PROVIDER: ${WHATSAPP_PROVIDER:-EVOLUTION}
      WHATSAPP_PHONE_NUMBER_ID: ${WHATSAPP_PHONE_NUMBER_ID:-}
      WHATSAPP_ACCESS_TOKEN: ${WHATSAPP_ACCESS_TOKEN:-}

      EVOLUTION_API_URL: ${EVOLUTION_API_URL:-http://evolution:8080}
      EVOLUTION_API_KEY: ${EVOLUTION_API_KEY:-change_me_evolution_key}
      EVOLUTION_INSTANCE: ${EVOLUTION_INSTANCE:-flowpilot}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npx tsx workers/automation-worker.ts
    networks:
      - flowpilot

  email-worker:
    build:
      context: ./web
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL:-postgresql://flowpilot:flowpilot123@postgres:5432/flowpilot?schema=public}
      REDIS_URL: ${REDIS_URL:-redis://:flowpilot123@redis:6379}

      RESEND_API_KEY: ${RESEND_API_KEY:-}
      EMAIL_FROM: ${EMAIL_FROM:-FlowPilot <hello@yourdomain.com>}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npx tsx workers/email-worker.ts
    networks:
      - flowpilot

  broadcast-worker:
    build:
      context: ./web
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL:-postgresql://flowpilot:flowpilot123@postgres:5432/flowpilot?schema=public}
      REDIS_URL: ${REDIS_URL:-redis://:flowpilot123@redis:6379}

      WHATSAPP_PROVIDER: ${WHATSAPP_PROVIDER:-EVOLUTION}
      WHATSAPP_PHONE_NUMBER_ID: ${WHATSAPP_PHONE_NUMBER_ID:-}
      WHATSAPP_ACCESS_TOKEN: ${WHATSAPP_ACCESS_TOKEN:-}

      EVOLUTION_API_URL: ${EVOLUTION_API_URL:-http://evolution:8080}
      EVOLUTION_API_KEY: ${EVOLUTION_API_KEY:-change_me_evolution_key}
      EVOLUTION_INSTANCE: ${EVOLUTION_INSTANCE:-flowpilot}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npx tsx workers/broadcast-worker.ts
    networks:
      - flowpilot

  drip-worker:
    build:
      context: ./web
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL:-postgresql://flowpilot:flowpilot123@postgres:5432/flowpilot?schema=public}
      REDIS_URL: ${REDIS_URL:-redis://:flowpilot123@redis:6379}

      WHATSAPP_PROVIDER: ${WHATSAPP_PROVIDER:-EVOLUTION}
      WHATSAPP_PHONE_NUMBER_ID: ${WHATSAPP_PHONE_NUMBER_ID:-}
      WHATSAPP_ACCESS_TOKEN: ${WHATSAPP_ACCESS_TOKEN:-}

      EVOLUTION_API_URL: ${EVOLUTION_API_URL:-http://evolution:8080}
      EVOLUTION_API_KEY: ${EVOLUTION_API_KEY:-change_me_evolution_key}
      EVOLUTION_INSTANCE: ${EVOLUTION_INSTANCE:-flowpilot}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npx tsx workers/drip-worker.ts
    networks:
      - flowpilot

  lead-sync-worker:
    build:
      context: ./web
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL:-postgresql://flowpilot:flowpilot123@postgres:5432/flowpilot?schema=public}
      REDIS_URL: ${REDIS_URL:-redis://:flowpilot123@redis:6379}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npx tsx workers/lead-sync-worker.ts
    networks:
      - flowpilot

  poster-worker:
    build:
      context: ./web
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL:-postgresql://flowpilot:flowpilot123@postgres:5432/flowpilot?schema=public}
      REDIS_URL: ${REDIS_URL:-redis://:flowpilot123@redis:6379}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npx tsx workers/poster-worker.ts
    networks:
      - flowpilot

  n8n:
    image: n8nio/n8n:latest
    restart: unless-stopped
    environment:
      N8N_HOST: ${N8N_HOST:-0.0.0.0}
      N8N_PORT: ${N8N_PORT:-5678}
      N8N_PROTOCOL: ${N8N_PROTOCOL:-http}
      WEBHOOK_URL: ${WEBHOOK_URL:-http://localhost:5678/}
      N8N_EDITOR_BASE_URL: ${N8N_EDITOR_BASE_URL:-http://localhost:5678/}
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY:-change_me_n8n_encryption_key}
      N8N_SECURE_COOKIE: "${N8N_SECURE_COOKIE:-false}"

      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: ${POSTGRES_DB:-flowpilot}
      DB_POSTGRESDB_USER: ${POSTGRES_USER:-flowpilot}
      DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD:-flowpilot123}
      DB_POSTGRESDB_SCHEMA: public

      EXECUTIONS_DATA_PRUNE: "true"
      EXECUTIONS_DATA_MAX_AGE: 168

      FLOWPILOT_PUBLIC_API_URL: ${FLOWPILOT_PUBLIC_API_URL:-http://web:3000}
      N8N_SHARED_SECRET: ${N8N_SHARED_SECRET:-}
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "${N8N_PORT_HOST:-5678}:5678"
    networks:
      - flowpilot

  evolution:
    image: atendai/evolution-api:latest
    restart: unless-stopped
    environment:
      SERVER_URL: ${EVOLUTION_SERVER_URL:-http://evolution:8080}
      AUTHENTICATION_API_KEY: ${EVOLUTION_API_KEY:-change_me_evolution_key}

      DATABASE_ENABLED: "true"
      DATABASE_PROVIDER: postgresql
      DATABASE_CONNECTION_URI: postgresql://${POSTGRES_USER:-flowpilot}:${POSTGRES_PASSWORD:-flowpilot123}@postgres:5432/evolution?schema=public
      DATABASE_CONNECTION_CLIENT_NAME: evolution

      QRCODE_LIMIT: "30"
    volumes:
      - evolution_instances:/evolution/instances
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "${EVOLUTION_PORT:-8080}:8080"
    networks:
      - flowpilot

volumes:
  postgres_data:
  redis_data:
  n8n_data:
  evolution_instances:

networks:
  flowpilot:
    driver: bridge