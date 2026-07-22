Final QA Test Scripts

Basic automated check:

BASE_URL=http://localhost:3000 ./scripts/qa-local.sh

Manual QA checklist:

1. Landing page loads.
2. Pricing page loads.
3. Login works.
4. Welcome page loads.
5. Dashboard loads.
6. Generate demo data works.
7. Contacts page loads.
8. Pipeline loads.
9. Inbox loads.
10. Broadcast creates campaign.
11. Automation builder saves workflow.
12. Billing portal loads.
13. Razorpay checkout opens if keys set.
14. Agency wizard creates client.
15. White-label landing loads at /l/client-slug.
16. Organization switcher changes workspace.
17. Mobile bottom navigation appears on small screens.
18. Design system page loads.
19. Support tickets create and reply.
20. Deployment checklist page loads.

API checks:

GET /api/health
GET /api/v1/me
GET /api/v1/contacts
GET /api/v1/analytics
GET /api/v1/billing/subscriptions
GET /api/v1/organizations

Worker checks:

docker compose logs worker
docker compose logs campaign-worker
docker compose logs automation-worker
docker compose logs email-worker