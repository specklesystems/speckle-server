#!/usr/bin/env bash
set -eo pipefail

GIT_ROOT=$( git rev-parse --show-toplevel )

CLOUDFLARE_PAGES_PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT_NAME:-"viewer"}"
CLOUDFLARE_PAGES_DIST_DIR="${CLOUDFLARE_PAGES_DIST_DIR:-"${GIT_ROOT}/packages/viewer-sandbox/dist"}"

npx wrangler pages publish "${GIT_ROOT}/${CLOUDFLARE_PAGES_DIST_DIR}" --project-name="${CLOUDFLARE_PAGES_PROJECT_NAME}"
