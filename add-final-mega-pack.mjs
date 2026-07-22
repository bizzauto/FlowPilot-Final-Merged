import fs from "fs";
import path from "path";

const root = process.cwd();

function write(file, content) {
  const fullPath = path.join(root, file);

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });

  if (fs.existsSync(fullPath)) {
    fs.copyFileSync(fullPath, fullPath + ".bak");
  }

  fs.writeFileSync(fullPath, content);
  console.log("WROTE: " + file);
}

const files = {};

files["README.md"] = `
# FlowPilot Pro - Final Mega Pack

FlowPilot Pro is a GoHighLevel-style SaaS automation platform.

## Core Features

- CRM and contacts
- Lead import connectors
- WhatsApp Evolution integration
- Meta WhatsApp support
- Unified inbox
- Advanced broadcast
- Broadcast A/B testing
- Drip campaigns
- Drip condition branches
- Automation builder
- Automation condition branches
- Poster editor
- Poster PNG export
- Poster template library
- Support tickets
- Billing portal
- Agency wizard
- n8n integration
- Redis queue workers
- PostgreSQL database
- Docker Compose
- Coolify deployment ready
- GitHub Actions CI/CD
- Production hardening scripts

## Project Structure

Root:
  docker-compose.yml
  .env.example
  README.md
  SECURITY.md
  CHANGELOG.md
  .github/workflows/ci.yml
  .github/workflows/deploy.yml
  docs/
  scripts/
  web/

## Local Setup

1. Prepare environment:
   cp .env.example .env

2. Replace CHANGE_ME values.

3. Start:
   docker compose up -d --build

4. Seed:
   docker compose exec web npm run seed

5. Add advanced models if needed:
   docker compose exec web node scripts/add-advanced-models.mjs
   docker compose exec web npx prisma db push --skip-generate
   docker compose exec web npx prisma generate

## Main URLs

App:
http://localhost:3000

Login:
http://localhost:3000/login

Dashboard:
http://localhost:3000/dashboard

Leads:
http://localhost:3000/leads

Lead Import:
http://localhost:3000/leads/import

Posters:
http://localhost:3000/posters

Poster Editor:
http://localhost:3000/posters/editor

Poster Templates:
http://localhost:3000/posters/templates

Broadcast:
http://localhost:3000/broadcast-advanced

Drip:
http://localhost:3000/drip

Automation Builder:
http://localhost:3000/automation-builder

Evolution WhatsApp:
http://localhost:3000/settings/whatsapp-evolution

n8n:
http://localhost:5678

Evolution API:
http://localhost:8080

## Scripts

Final QA:
bash scripts/final-qa.sh http://localhost:3000

Environment check:
bash scripts/check-env.sh

Backup database:
bash scripts/backup-db.sh

Restore database:
bash scripts/restore-db.sh ./backups/yourfile.sql.gz

Logs:
bash scripts/logs.sh web
bash scripts/logs.sh broadcast-worker
bash scripts/logs.sh drip-worker
bash scripts/logs.sh automation-worker

Publish to GitHub:
bash scripts/publish-github.sh flowpilot-pro private

## Production Deployment

Read:
docs/COOLIFY-ONE-CLICK.md

Security:
SECURITY.md

Troubleshooting:
docs/TROUBLESHOOTING.md

Client demo:
docs/CLIENT-DEMO-SCRIPT.md

Sales kit:
docs/SALES-KIT.md

## Important Compliance Notes

- Evolution API is unofficial. Use Meta WhatsApp Cloud API for production.
- Send WhatsApp messages only to opted-in contacts.
- Honor STOP and opt-out requests.
- Follow IndiaMART / TradeIndia terms when importing leads.
- Do not spam scraped data.
`;

files[".gitignore"] = `
node_modules
.env
.env.secrets
.next
*.log
backups/
.DS_Store
`;

files["SECURITY.md"] = `
# Security Guide

## Must Do Before Production

1. Replace all CHANGE_ME secrets.
2. Use HTTPS domains.
3. Set strong Postgres password.
4. Set strong Redis password.
5. Set NEXTAUTH_SECRET.
6. Set N8N_ENCRYPTION_KEY.
7. Set EVOLUTION_API_KEY.
8. Set LEAD_WEBHOOK_TOKEN.
9. Never commit .env.
10. Rotate secrets regularly.

## WhatsApp Compliance

- Use opt-in contacts only.
- Handle STOP keyword.
- Use approved templates for outbound marketing.
- Prefer Meta WhatsApp Cloud API in production.
- Monitor WhatsApp quality rating.

## Lead Compliance

- Use official APIs where possible.
- Respect platform terms.
- Store consent status.
- Allow opt-out.
- Avoid unsolicited spam.

## Server Hardening

- Use firewall.
- Expose only required ports.
- Use reverse proxy with HTTPS.
- Keep Docker images updated.
- Monitor logs.
- Enable backups.
`;

files["CHANGELOG.md"] = `
# Changelog

## v1.0.0

- Initial FlowPilot Pro build.
- CRM and contacts.
- Lead import connectors.
- WhatsApp Evolution integration.
- Meta WhatsApp support.
- Unified inbox.
- Advanced broadcast.
- Broadcast A/B testing.
- Drip campaigns.
- Drip condition branches.
- Automation builder.
- Automation condition branches.
- Poster editor.
- Poster PNG export.
- Poster template library.
- Support tickets.
- Billing portal.
- Agency wizard.
- n8n integration.
- Docker Compose.
- Coolify deployment guide.
- GitHub Actions CI/CD.
- Production hardening scripts.
`;

files[".github/workflows/ci.yml"] = `
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: web

    env:
      DATABASE_URL: postgresql://ci:ci@localhost:5432/ci
      REDIS_URL: redis://localhost:6379
      NEXTAUTH_SECRET: ci-secret

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Prisma generate
        run: npx prisma generate

      - name: Build
        run: npm run build

  docker:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build Docker images
        run: docker compose build
`;

files[".github/workflows/deploy.yml"] = `
name: Deploy

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Coolify webhook
        run: curl -X POST -H "Authorization: Bearer \${{ secrets.COOLIFY_TOKEN }}" "\${{ secrets.COOLIFY_WEBHOOK_URL }}"
`;

files["docs/COOLIFY-ONE-CLICK.md"] = `
# Coolify One-Click Style Deployment

## 1. Push Code to GitHub

Use:

bash scripts/publish-github.sh flowpilot-pro private

Or manually create a private GitHub repository and push.

## 2. Create Coolify Project

1. Open Coolify.
2. Create new project.
3. Choose Docker Compose.
4. Connect GitHub repository.
5. Branch: main.
6. Base directory: /
7. Docker Compose file: docker-compose.yml

## 3. Add Domains

Add two domains:

App domain:
app.yourdomain.com -> web service port 3000

n8n domain:
n8n.yourdomain.com -> n8n service port 5678

Optional Evolution domain:
evolution.yourdomain.com -> evolution service port 8080

## 4. Add Environment Variables

Set production values:

POSTGRES_USER=flowpilot
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=flowpilot

DATABASE_URL=postgresql://flowpilot:CHANGE_ME@postgres:5432/flowpilot?schema=public

REDIS_PASSWORD=CHANGE_ME
REDIS_URL=redis://:CHANGE_ME@redis:6379

NEXTAUTH_URL=https://app.yourdomain.com
NEXTAUTH_SECRET=CHANGE_ME

DEFAULT_ORGANIZATION_ID=

WHATSAPP_PROVIDER=EVOLUTION

EVOLUTION_SERVER_URL=http://evolution:8080
EVOLUTION_API_URL=http://evolution:8080
EVOLUTION_API_KEY=CHANGE_ME
EVOLUTION_INSTANCE=flowpilot

LEAD_WEBHOOK_TOKEN=CHANGE_ME

N8N_PROTOCOL=https
N8N_SECURE_COOKIE=true

WEBHOOK_URL=https://n8n.yourdomain.com/
N8N_EDITOR_BASE_URL=https://n8n.yourdomain.com/

N8N_ENCRYPTION_KEY=CHANGE_ME
N8N_SHARED_SECRET=CHANGE_ME

FLOWPILOT_PUBLIC_API_URL=http://web:3000

## 5. Deploy

Click Deploy.

## 6. After Deploy

Run seed:

docker compose exec web npm run seed

If using advanced models:

docker compose exec web node scripts/add-advanced-models.mjs
docker compose exec web npx prisma db push --skip-generate
docker compose exec web npx prisma generate

Set DEFAULT_ORGANIZATION_ID from seed output.

Restart:

docker compose restart

## 7. Webhooks

WhatsApp webhook:

https://app.yourdomain.com/api/whatsapp/webhook

Evolution webhook:

https://app.yourdomain.com/api/v1/evolution/webhook

Lead import webhooks:

https://app.yourdomain.com/api/v1/connectors/indiamart?organizationId=ORG_ID&token=YOUR_TOKEN
https://app.yourdomain.com/api/v1/connectors/tradeindia?organizationId=ORG_ID&token=YOUR_TOKEN
https://app.yourdomain.com/api/v1/connectors/apify?organizationId=ORG_ID&token=YOUR_TOKEN

Razorpay webhook:

https://app.yourdomain.com/api/billing/razorpay/webhook
`;

files["docs/FINAL-QA.md"] = `
# Final QA Checklist

Run automated QA:

bash scripts/final-qa.sh http://localhost:3000

Manual QA:

1. Landing page loads.
2. Pricing page loads.
3. Login works.
4. Dashboard loads.
5. Leads page loads.
6. Lead CSV import works.
7. Lead webhook creates lead.
8. Contacts page loads.
9. Inbox loads.
10. Evolution instance creates.
11. Evolution QR appears.
12. Evolution status polling works.
13. Broadcast audience count works.
14. Broadcast create works.
15. Broadcast A/B test create works.
16. Broadcast queue works.
17. Drip sequence create works.
18. Drip steps save works.
19. Drip condition step works.
20. Drip activate works.
21. Drip enroll test phone works.
22. Automation trigger select works.
23. Automation condition action works.
24. Automation save works.
25. Poster editor drag works.
26. Poster save works.
27. Poster PNG download works.
28. Poster template seed works.
29. Poster template load in editor works.
30. Billing portal loads.
31. Support tickets work.
32. n8n loads.
33. Backup script works.
34. Restore script works.
35. Environment checker passes.
`;

files["docs/CLIENT-DEMO-SCRIPT.md"] = `
# Client Demo Script

Duration: 10 to 15 minutes.

## Pre-Demo

- App running.
- Admin login ready.
- Demo leads imported.
- Evolution instance connected.
- Poster templates ready.
- Broadcast draft ready.
- Drip sequence ready.
- Automation ready.

## Demo Flow

1. Open landing page.
   Say: This is the public marketing site.

2. Open pricing.
   Say: Clients can choose plans.

3. Login.
   Say: This is the secure SaaS dashboard.

4. Open dashboard.
   Say: This shows business metrics.

5. Open leads.
   Say: Leads come from CSV, webhooks, IndiaMART, TradeIndia or Apify.

6. Open lead import.
   Say: Show CSV import and webhook URLs.

7. Open inbox.
   Say: WhatsApp conversations appear here.

8. Open Evolution settings.
   Say: Connect WhatsApp by QR. Auto polling checks connection.

9. Open broadcast.
   Say: Build audience and send bulk WhatsApp with rate limiting.

10. Enable A/B test.
   Say: Test two messages and compare response.

11. Open drip.
   Say: Create automated follow-up sequence with conditions.

12. Open automation builder.
   Say: Trigger-based automation with conditions and actions.

13. Open poster editor.
   Say: Create marketing poster using drag and drop.

14. Download poster PNG.
   Say: Use in WhatsApp campaigns.

15. Open billing portal.
   Say: Manage subscription.

16. Open support.
   Say: Customer support tickets.

17. Close demo.
   Say: This is a complete revenue automation platform.
`;

files["docs/SALES-KIT.md"] = `
# Sales Kit

## Product Name

FlowPilot Pro

## One-Line Pitch

All-in-one CRM, WhatsApp automation, marketing and sales platform for growing businesses and agencies.

## Problem

Businesses lose leads because follow-up is manual.
Teams scatter conversations across WhatsApp, email and spreadsheets.
Marketing campaigns are delayed.
Agencies struggle to manage multiple clients.

## Solution

FlowPilot Pro combines CRM, WhatsApp inbox, broadcast campaigns, drip automation, poster marketing, billing and agency client management in one platform.

## Main Benefits

- Reply to leads faster.
- Automate WhatsApp follow-up.
- Run bulk campaigns safely.
- Create marketing posters in minutes.
- Manage multiple clients.
- Track revenue and analytics.
- Deploy on your own server.

## Pricing Idea

Starter:
Free or low price.
CRM, contacts, basic dashboard.

Growth:
Monthly paid.
WhatsApp inbox, campaigns, automations, posters.

Agency:
Higher monthly paid.
Multi-client, white-label, API access.

## Objection Handling

Objection:
Is WhatsApp safe?

Answer:
Use official Meta WhatsApp API for production. Evolution API is optional and should be used carefully.

Objection:
Can we self-host?

Answer:
Yes. It is Docker Compose ready and Coolify compatible.

Objection:
Can we manage multiple clients?

Answer:
Yes. Agency mode supports client workspaces and white-label pages.

Objection:
Can we import leads?

Answer:
Yes. CSV, webhooks, Apify and custom connectors are supported.

## Demo CTA

Start with a 10-minute demo.
Then create a pilot workspace.
Import 100 leads.
Run one broadcast.
Create one drip sequence.
Measure replies.
`;

files["docs/TROUBLESHOOTING.md"] = `
# Troubleshooting

## App not starting

Check logs:

bash scripts/logs.sh web

Common issues:
- Missing .env values.
- Database not ready.
- Redis not ready.
- Prisma client not generated.

Fix:

docker compose exec web npx prisma generate
docker compose restart

## Database error

Check Postgres:

bash scripts/logs.sh postgres

Fix:

docker compose restart postgres

## Redis error

Check Redis:

bash scripts/logs.sh redis

Fix:

docker compose restart redis

## Evolution QR not appearing

Check Evolution logs:

bash scripts/logs.sh evolution

Check:

EVOLUTION_API_URL
EVOLUTION_API_KEY

Inside web container, Evolution URL should be:

http://evolution:8080

## Broadcast not sending

Check broadcast worker:

bash scripts/logs.sh broadcast-worker

Common issues:
- WhatsApp provider not configured.
- Evolution instance disconnected.
- Leads not opted in.
- No phone numbers.

## Drip not running

Check drip worker:

bash scripts/logs.sh drip-worker

Common issues:
- Drip not activated.
- No steps saved.
- Lead has no phone.
- Consent opted out.

## Automation not running

Check automation worker:

bash scripts/logs.sh automation-worker

Common issues:
- Workflow not active.
- Trigger name mismatch.
- Missing payload phone.
`;

files["scripts/final-qa.sh"] = `
#!/usr/bin/env bash
set -euo pipefail

BASE_URL="$1"

if [ -z "$BASE_URL" ]; then
  BASE_URL="http://localhost:3000"
fi

echo "Running FlowPilot final QA against $BASE_URL"

check() {
  URL="$1"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

  if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ] || [ "$STATUS" = "307" ]; then
    echo "OK: $URL ($STATUS)"
  else
    echo "FAIL: $URL ($STATUS)"
    exit 1
  fi
}

check "$BASE_URL/"
check "$BASE_URL/pricing"
check "$BASE_URL/login"
check "$BASE_URL/api/health"

echo "Basic QA passed."
echo "Now complete manual QA from docs/FINAL-QA.md"
`;

files["scripts/check-env.sh"] = `
#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  echo "FAIL: .env not found."
  exit 1
fi

set -a
. ./.env
set +a

FAILED=0

required() {
  NAME="$1"
  VALUE="$2"

  if [ -z "$VALUE" ]; then
    echo "MISSING: $NAME"
    FAILED=1
  else
    echo "OK: $NAME"
  fi
}

required POSTGRES_USER "$POSTGRES_USER"
required POSTGRES_PASSWORD "$POSTGRES_PASSWORD"
required POSTGRES_DB "$POSTGRES_DB"
required DATABASE_URL "$DATABASE_URL"
required REDIS_PASSWORD "$REDIS_PASSWORD"
required REDIS_URL "$REDIS_URL"
required NEXTAUTH_URL "$NEXTAUTH_URL"
required NEXTAUTH_SECRET "$NEXTAUTH_SECRET"

if [ "$FAILED" = "1" ]; then
  echo "Environment check failed."
  exit 1
fi

echo "Environment check passed."
`;

files["scripts/backup-db.sh"] = `
#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  echo "FAIL: .env not found."
  exit 1
fi

set -a
. ./.env
set +a

mkdir -p backups

TIMESTAMP=$(date +%F_%H-%M-%S)
FILE="backups/flowpilot_$TIMESTAMP.sql.gz"

echo "Creating backup: $FILE"

docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILE"

echo "Backup complete."
`;

files["scripts/restore-db.sh"] = `
#!/usr/bin/env bash
set -euo pipefail

FILE="$1"

if [ -z "$FILE" ]; then
  echo "Usage: ./scripts/restore-db.sh ./backups/flowpilot_FILE.sql.gz"
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "FAIL: File not found: $FILE"
  exit 1
fi

if [ ! -f .env ]; then
  echo "FAIL: .env not found."
  exit 1
fi

set -a
. ./.env
set +a

echo "Restoring from $FILE"

gunzip -c "$FILE" | docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "Restore complete."
`;

files["scripts/logs.sh"] = `
#!/usr/bin/env bash
set -euo pipefail

SERVICE="$1"

if [ -z "$SERVICE" ]; then
  docker compose logs -f
else
  docker compose logs -f "$SERVICE"
fi
`;

files["scripts/publish-github.sh"] = `
#!/usr/bin/env bash
set -euo pipefail

REPO="$1"
VISIBILITY="$2"

if [ -z "$REPO" ]; then
  REPO="flowpilot-pro"
fi

if [ -z "$VISIBILITY" ]; then
  VISIBILITY="private"
fi

echo "Publishing to GitHub repository: $REPO"
echo "Visibility: $VISIBILITY"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI not installed."
  echo "Install from https://cli.github.com/"
  exit 1
fi

gh auth status || gh auth login

if [ ! -d .git ]; then
  git init -b main
fi

git add .
git commit -m "FlowPilot Pro final mega pack" || echo "No changes to commit"

if gh repo view "$REPO" >/dev/null 2>&1; then
  echo "Repository already exists."

  REMOTE_URL=$(gh repo view "$REPO" --json sshUrl -q .sshUrl)

  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "$REMOTE_URL"
  else
    git remote set-url origin "$REMOTE_URL"
  fi

  git push -u origin main
else
  if [ "$VISIBILITY" = "public" ]; then
    gh repo create "$REPO" --public --source=. --remote=origin --push
  else
    gh repo create "$REPO" --private --source=. --remote=origin --push
  fi
fi

echo "Done."
`;

for (const [file, content] of Object.entries(files)) {
  write(file, content);
}

console.log("Final mega pack added.");