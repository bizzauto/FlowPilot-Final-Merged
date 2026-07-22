Final Production Launch Commands

Local setup:

cd flowpilot-final
./scripts/setup-env.sh
docker compose up --build
docker compose exec web npm run seed
docker compose exec web npm run apikey -- acme n8n

Ticket tables:

docker compose run --rm web node scripts/add-tickets.mjs
docker compose run --rm web npx prisma db push --skip-generate

QA test:

chmod +x scripts/qa-local.sh
BASE_URL=http://localhost:3000 ./scripts/qa-local.sh

Production server:

git clone git@github.com:YOUR_USERNAME/flowpilot-pro.git
cd flowpilot-pro
cp .env.example .env
nano .env
chmod +x scripts/*.sh
docker compose up -d --build
docker compose exec web npm run seed
docker compose run --rm web node scripts/add-tickets.mjs
docker compose run --rm web npx prisma db push --skip-generate

Logs:

docker compose logs -f
docker compose logs -f worker
docker compose logs -f campaign-worker
docker compose logs -f automation-worker
docker compose logs -f email-worker
docker compose logs -f n8n

Backup:

./scripts/backup-db.sh

Restore:

./scripts/restore-db.sh ./backups/your-backup-file.sql.gz

Prisma:

docker compose exec web npx prisma generate
docker compose exec web npx prisma db push
docker compose exec web npx prisma migrate deploy
docker compose exec web npx prisma studio

Restart:

docker compose restart

Stop:

docker compose down

Full clean:

docker compose down -v