Final Testing Checklist

Local Tests:

1. Open:
   http://localhost:3000/welcome

2. Login:
   admin@flowpilot.local
   ChangeAdmin@123

3. Check:
   /dashboard
   /contacts
   /pipeline
   /inbox
   /campaigns
   /automations
   /settings
   /settings/billing
   /settings/agency
   /settings/white-label
   /settings/production

API Tests:

GET /api/health
GET /api/v1/me
GET /api/v1/contacts
GET /api/v1/analytics
GET /api/v1/onboarding/status

WhatsApp Tests:

1. Configure WhatsApp env.
2. Set webhook:
   https://yourdomain.com/api/whatsapp/webhook
3. Send test message.
4. Check inbox.
5. Check worker logs:
   docker compose logs worker

Campaign Tests:

1. Create campaign.
2. Queue campaign.
3. Check campaign-worker logs:
   docker compose logs campaign-worker

Automation Tests:

1. Create automation.
2. Click Run Test.
3. Check automation-worker logs:
   docker compose logs automation-worker

Email Tests:

1. Set RESEND_API_KEY.
2. Trigger email automation or campaign.
3. Check email-worker logs:
   docker compose logs email-worker

Billing Tests:

1. Set Stripe keys.
2. Create Stripe price IDs.
3. Open /settings/billing.
4. Click upgrade.
5. Complete test payment.
6. Check Stripe webhook:
   /api/billing/stripe/webhook

Backup Tests:

1. Run:
   ./scripts/backup-db.sh

2. Check backups folder.

3. Restore test:
   ./scripts/restore-db.sh ./backups/yourfile.sql.gz