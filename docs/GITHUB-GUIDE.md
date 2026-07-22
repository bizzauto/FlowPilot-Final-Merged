GitHub Repository Organization Guide

Repository name:

flowpilot-pro

Visibility:

Private

Branch strategy:

main = production
develop = optional development
feature branches = feature/name

Commit convention:

feat: add landing page
feat: add razorpay billing
fix: correct webhook signature
docs: update coolify guide
chore: update env example

Push script:

./scripts/publish-github.sh flowpilot-pro private

Never commit:

.env
backups/
node_modules/
.next/
*.log

Recommended .gitignore:

node_modules
.env
.env.local
.next
*.log
.DS_Store
backups/

Release tags:

git tag v1.0.0
git push origin v1.0.0

Repository structure:

flowpilot-pro/
  docker-compose.yml
  .env.example
  README.md
  README-PRODUCTION.md
  docs/
  scripts/
  coolify/
  web/