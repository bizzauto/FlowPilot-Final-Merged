#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="${1:-flowpilot-pro}"
VISIBILITY="${2:-private}"

echo "Publishing to GitHub repository: $REPO_NAME"
echo "Visibility: $VISIBILITY"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI not installed."
  echo "Install it from https://cli.github.com/"
  echo ""
  echo "Manual method:"
  echo "1. Create repository on GitHub"
  echo "2. Run:"
  echo "   git init -b main"
  echo "   git add ."
  echo "   git commit -m \"FlowPilot Pro final\""
  echo "   git remote add origin https://github.com/YOUR_USERNAME/${REPO_NAME}.git"
  echo "   git push -u origin main"
  exit 1
fi

gh auth status || gh auth login

if [ ! -d .git ]; then
  git init -b main
fi

git add .
git commit -m "FlowPilot Pro final production build" || echo "No changes to commit"

if gh repo view "$REPO_NAME" >/dev/null 2>&1; then
  echo "Repository already exists."

  REMOTE_URL="$(gh repo view "$REPO_NAME" --json sshUrl -q .sshUrl)"

  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "$REMOTE_URL"
  else
    git remote set-url origin "$REMOTE_URL"
  fi

  git push -u origin main
else
  if [ "$VISIBILITY" = "public" ]; then
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
  else
    gh repo create "$REPO_NAME" --private --source=. --remote=origin --push
  fi
fi

echo ""
echo "Done. Repository ready on GitHub."