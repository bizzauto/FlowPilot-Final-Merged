Coolify One-Click Style Deployment

1. Push final folder to GitHub:
   cd flowpilot-final
   ./scripts/publish-github.sh flowpilot-pro private

2. Open Coolify.

3. Create New Project.

4. Choose:
   Deployment type: Docker Compose

5. Connect GitHub repository:
   flowpilot-pro

6. Branch:
   main

7. Base directory:
   /

8. Docker Compose file:
   docker-compose.yml

9. Add environment variables.
   You can copy values from .env.example.

10. Important production variables:

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

11. Add domains in Coolify:

web service:
app.yourdomain.com -> port 3000

n8n service:
n8n.yourdomain.com -> port 5678

12. Enable HTTPS.

13. Deploy.

14. After deploy, run seed:
   docker compose exec web npm run seed

15. Set DEFAULT_ORGANIZATION_ID from seed output.

16. Redeploy or restart services.