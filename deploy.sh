#!/bin/bash
# Deploy the worksheet to the nginx server by rsyncing the static files.
# Server settings come from .env (see .env.example).
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.example to .env and fill it in." >&2
  exit 1
fi
source .env

: "${DEPLOY_USER:?DEPLOY_USER not set in .env}"
: "${DEPLOY_HOST:?DEPLOY_HOST not set in .env}"
: "${DEPLOY_PATH:?DEPLOY_PATH not set in .env}"

echo "Deploying to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}..."
# --no-owner/--no-group: the deploy user can't chown/chgrp files created by
# other users on the server, and nginx doesn't care who owns them.
rsync -avz --no-owner --no-group --delete \
  index.html scripts styles \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "Deployed."
