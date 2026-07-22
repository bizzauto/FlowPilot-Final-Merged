Coolify Deployment Steps

1. Create Coolify project.
2. Choose Docker Compose.
3. Connect GitHub repository or upload folder.
4. Base directory: /
5. Docker Compose file: docker-compose.yml
6. Add environment variables.
7. Add domains:
   web service port 3000
   n8n service port 5678
8. Enable HTTPS.
9. Deploy.

After deploy:

1. Open app domain.
2. Open n8n domain.
3. Create n8n owner account.
4. Run seed:
   docker compose exec web npm run seed

5. Set DEFAULT_ORGANIZATION_ID from seed output.
6. Redeploy or restart services.