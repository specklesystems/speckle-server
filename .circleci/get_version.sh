#!/bin/bash
set -eo pipefail

LAST_RELEASE="$(git describe --always --tags "$(git rev-list --tags)" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1)"
NEXT_RELEASE="$(echo "${LAST_RELEASE}" | python -c "parts = input().split('.'); parts[-1] = str(int(parts[-1])+1); print('.'.join(parts))")"

if [[ "${CIRCLE_TAG}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "${CIRCLE_TAG}"
    exit 0
fi

if [[ "${CIRCLE_BRANCH}" == "main" ]]; then
    echo "$NEXT_RELEASE-alpha.${CIRCLE_BUILD_NUM}"
    exit 0
fi

BRANCH_NAME_TRUNCATED="$(echo "${CIRCLE_BRANCH}" | cut -c -50)" # docker has a 128 character tag limit, so ensuring the branch name will be short enough
COMMIT_SHA1_TRUNCATED="$(echo "${CIRCLE_SHA1}" | cut -c -7)"
echo "$NEXT_RELEASE-branch.${BRANCH_NAME_TRUNCATED}.${COMMIT_SHA1_TRUNCATED}.${CIRCLE_BUILD_NUM}"
exit 0
