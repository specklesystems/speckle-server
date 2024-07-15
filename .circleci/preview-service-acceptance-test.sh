#!/usr/bin/env bash
set -o pipefail

# Requires to be run in a CircleCI environment with the following environment variables:
# - GH_USER
# - GH_TOKEN
# - PG_CONNECTION_STRING

GIT_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

if [ -z "${PG_CONNECTION_STRING}" ]; then
  echo "🚫 Environment variable PG_CONNECTION_STRING must be set."
  exit 1
fi

if [ -z "${GH_USER}" ]; then
  echo "🚫 Environment variable GH_USER must be set."
  exit 1
fi

if [ -z "${GH_TOKEN}" ]; then
  echo "🚫 Environment variable GH_TOKEN must be set."
  exit 1
fi

sudo apt-get update && \
  DEBIAN_FRONTEND=noninteractive sudo apt-get install -y \
  --no-install-recommends \
  jq \
  jo \
  postgresql-client

echo "💾 Loading image"
docker load --input "/tmp/ci/workspace/${DOCKER_FILE_NAME}"

echo "🐘 Running SQL migrations"
psql --echo-all \
  --file="${GIT_ROOT}/packages/preview-service/tests/migrations/acceptance-test-migration.sql" \
  "${PG_CONNECTION_STRING}"

echo "💾 Storing model data in Postgresql to trigger acceptance test"
psql --echo-all \
  --file="${GIT_ROOT}/packages/preview-service/tests/migrations/acceptance-test-migration.sql" \
  "${PG_CONNECTION_STRING}"

echo "💓 Polling for preview to be completed"
#TODO psql to determine if row exists

echo "🛟 Saving image to temporary file on disk"
#TODO psql to get the image
PREVIEW_IMAGE_PATH="/tmp/ci/workspace/preview-image.png"

echo "📌 Publishing preview image to GitHub"

echo "  - 🔍 Checking for a PR to update"
pr_response="$(curl --location --request GET "https://api.github.com/repos/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}/pulls?head=${CIRCLE_PROJECT_USERNAME}:${CIRCLE_BRANCH}&state=open" \
-u "${GH_USER}:${GH_TOKEN}")"

if [ "$(echo "${pr_response}" | jq length)" -eq 0 ]; then
  echo "No PR found to update"
  exit 1
elif [ "$(echo "${pr_response}" | jq -r ".message")" = "Not Found" ]; then
  echo "No PR found to update"
  exit 1
fi

echo "  - 🖼️ Uploading preview image as an attachment to the PR"
curl --location --request POST "${pr_comment_url}" \
    -u "${GH_USER}:${GH_TOKEN}" \
    --header 'Content-Type: application/octet-stream' \
    --data "@${PREVIEW_IMAGE_PATH}" #The '@' symbolizes curl should read data from file

pr_comment_url="$(echo "${pr_response}" | jq -r ".[]._links.comments.href")"

existing_comments="$(curl --location --request GET "${pr_comment_url}" -u "${GH_USER}:${GH_TOKEN}")"
existing_user_comment_url=""
if [ "$(echo "${existing_comments}" | jq length)" -gt 0 ]; then
  echo "There are existing comments, searching for Preview Service comments by ${GH_USER}"
  existing_user_comment_url="$(echo "${existing_comments}" | jq -r '.[] | select( .user.login == env.GH_USER ) | select( .body | contains("Preview Service Acceptance Test Output")) | .url')"
fi

# we use this title to search for the comment in the PR, so both have to be the same and it has to be relatively unique phrase
RAW_BODY="# Preview Service Acceptance Test Output

"

echo "${RAW_BODY}" > RAWBODY
echo "${RAW_BODY}"

jo -- -s body=@RAWBODY > RAWDATA

if [ "${existing_user_comment_url}" == "" ]; then
  echo "  - 📝 Creating a new comment"
  curl --location --request POST "${pr_comment_url}" \
    -u "${GH_USER}:${GH_TOKEN}" \
    --header 'Content-Type: application/json' \
    --data @RAWDATA
else
  echo "  - ♻️ Updating an existing comment"
  curl --location --request PATCH "${existing_user_comment_url}" \
    -u "${GH_USER}:${GH_TOKEN}" \
    --header 'Content-Type: application/json' \
    --data @RAWDATA
fi
