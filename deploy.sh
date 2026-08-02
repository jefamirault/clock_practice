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

# ── Deploy stamp ─────────────────────────────────────────────────────────────
# Ship a deploy.json alongside the site so "what's live?" is answerable from
# outside — the status dashboard reads it over https, and so can you.
# Timestamp + short SHA + branch leak nothing actionable; keep it public.
# Degrades to no stamp outside a git checkout rather than failing the deploy.
# NOTE: this script has no FILES allowlist — the stamp rides in STAMP[], which
# stays empty outside a git checkout so rsync is never handed a missing path.
STAMP=()
if git rev-parse HEAD >/dev/null 2>&1; then
  DIRTY=false; git diff --quiet HEAD -- 2>/dev/null || DIRTY=true
  printf '{"deployed_at":"%s","commit":"%s","branch":"%s","dirty":%s}\n' \
    "$(date -u +%FT%TZ)" "$(git rev-parse --short HEAD)" \
    "$(git rev-parse --abbrev-ref HEAD)" "$DIRTY" > deploy.json
  STAMP=(deploy.json)
fi

echo "Deploying to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}..."
# --no-owner/--no-group: the deploy user can't chown/chgrp files created by
# other users on the server, and nginx doesn't care who owns them.
rsync -avz --no-owner --no-group --delete \
  index.html scripts styles ${STAMP[@]+"${STAMP[@]}"} \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "Deployed."
