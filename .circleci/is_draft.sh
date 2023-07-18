#!/usr/bin/env bash

# acknowledgements: https://github.com/vitalinfo/circleci-cancel-draft

set -euf -o pipefail

if [[ -z "${CIRCLE_PULL_REQUEST}" ]]; then
  echo "FALSE"
fi

if [[ -z "${GITHUB_TOKEN}" ]]; then
  echo "GITHUB_TOKEN is not set"
  exit 1
fi

PR_NUMBER="${CIRCLE_PULL_REQUEST//[!0-9]/}"
RESPONSE=$(curl --silent \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
 "https://api.github.com/repos/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}/pulls/${PR_NUMBER}"
)

DRAFT=$(echo "${RESPONSE}" | jq ".draft")
DRAFT_LABEL=$(echo "${RESPONSE}" | jq ".labels | map(select(.name | test(\"Draft\"))) | .[]")

if [[ ${DRAFT} == 'true' || ${DRAFT_LABEL} ]]; then
  echo "TRUE"
else
  echo "FALSE"
fi

exit 0
