#!/usr/bin/env bash
set -eo pipefail

GIT_ROOT=$( git rev-parse --show-toplevel )

CLOUDFLARE_PAGES_PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT_NAME:-"viewer"}"
VIEWER_SANDBOX_DIR_PATH="${VIEWER_SANDBOX_DIR_PATH:-"${GIT_ROOT}/packages/viewer-sandbox/dist"}"

pushd "${GIT_ROOT}/${VIEWER_SANDBOX_DIR_PATH}"
yarn wrangler pages publish "${GIT_ROOT}/${VIEWER_SANDBOX_DIR_PATH}/dist" --project-name="${CLOUDFLARE_PAGES_PROJECT_NAME}"
popd
