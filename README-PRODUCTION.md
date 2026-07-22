FlowPilot Production Guide

1. Server Requirements

Recommended VPS:
- 2 CPU
- 4 GB RAM minimum
- 40 GB SSD
- Ubuntu 22.04 or 24.04

2. Install Coolify

Use official Coolify installation on your VPS.

3. Deploy Project

Option A: GitHub
- Push flowpilot-part3 to private GitHub repository.
- Connect repository to Coolify.
- Deployment type: Docker Compose.
- Docker Compose file: docker-compose.yml.
- Build.

Option B: Upload ZIP
- Upload ZIP to server.
- Extract.
- Connect folder to Coolify as local Docker Compose project.

4. Domains

Add domains in Coolify:

App:
app.yourdomain.com -> web service port 3000

n8n:
n8n.yourdomain.com -> n8n service port 5678

Coolify can provision HTTPS automatically using Let's Encrypt.

5. Environment Variables

Set production values in Coolify or .env:

POSTGRES_PASSWORD
REDIS_PASSWORD
NEXTAUTH_URL
NEXTAUTH_SECRET
DEFAULT_ORGANIZATION_ID
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN
WHATSAPP_VERIFY_TOKEN
WHATSAPP_APP_SECRET
N8N_ENCRYPTION_KEY
N8N_SECURE_COOKIE=true
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.yourdomain.com/
N8N_EDITOR_BASE_URL=https://n8n.yourdomain.com/
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_GROWTH
STRIPE_PRICE_AGENCY

6. Database Backup

Run:

./scripts/backup-db.sh

Backups are stored in:

./backups

7. Database Restore

Run:

./scripts/restore-db.sh ./backups/your-backup.sql.gz

8. Monitoring

Use:
- Coolify metrics
- Docker logs
- Sentry
- Uptime monitoring

9. Sentry

Recommended:

npx @sentry/wizard@latest -i nextjs

Then set:

SENTRY_DSN

10. WhatsApp Compliance

- Only message opted-in users.
- Honor STOP/opt-out.
- Use approved templates for outbound marketing.
- Monitor WhatsApp quality rating.