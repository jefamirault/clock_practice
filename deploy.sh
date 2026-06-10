#!/bin/bash
# Deploy the worksheet to GitHub Pages by pushing the current commit to the
# gh-pages branch. No build step — the repo root is served as-is.
set -euo pipefail
cd "$(dirname "$0")"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree has uncommitted changes; commit or stash them first." >&2
  exit 1
fi

echo "Deploying $(git rev-parse --short HEAD) to gh-pages..."
git push origin HEAD:gh-pages --force

# Point GitHub Pages at the gh-pages branch; harmless no-op if already set up.
if command -v gh >/dev/null; then
  gh api repos/{owner}/{repo}/pages -X POST \
    -f 'source[branch]=gh-pages' -f 'source[path]=/' >/dev/null 2>&1 || true
fi

echo "Deployed: https://jefamirault.github.io/clock_practice/"
