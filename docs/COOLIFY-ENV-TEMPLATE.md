Coolify Deployment Guide

1. Push repository to GitHub.
2. Open Coolify.
3. Create new project.
4. Choose Docker Compose.
5. Connect GitHub repository.
6. Branch: main
7. Base directory: /
8. Docker Compose file: docker-compose.yml
9. Add environment variables.
10. Add domains:
    web service port 3000
    n8n service port 5678
11. Enable HTTPS.
12. Deploy.
13. Run seed.
14. Set DEFAULT_ORGANIZATION_ID.
15. Restart services.

Domains example:

app.yourdomain.com -> web port 3000
n8n.yourdomain.com -> n8n port 5678

Webhooks after deployment:

WhatsApp webhook:
https://app.yourdomain.com/api/whatsapp/webhook

Razorpay webhook:
https://app.yourdomain.com/api/billing/razorpay/webhook

n8n webhook example:
https://n8n.yourdomain.com/webhook/flowpilot-event