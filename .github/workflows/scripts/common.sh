#!/usr/bin/env bash
set -eo pipefail

DOCKER_IMAGE_TAG="speckle/speckle-${SPECKLE_SERVER_PACKAGE}"

echo "1 ${DOCKER_IMAGE_TAG}"

# shellcheck disable=SC2034,SC2086
IMAGE_VERSION_TAG="${IMAGE_VERSION_TAG:-${GITHUB_SHA}}"

echo "2 ${IMAGE_VERSION_TAG}"

echo "3 $(git rev-list --tags)"
echo "3.2 $(git describe --always --tags $(git rev-list --tags))"
echo "3.3 $(git describe --always --tags $(git rev-list --tags) | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$')"

# shellcheck disable=SC2068,SC2046
LAST_RELEASE="$(git describe --always --tags $(git rev-list --tags) | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1)" # get the last release tag. FIXME: Fails if a commit is tagged with more than one tag: https://stackoverflow.com/questions/8089002/git-describe-with-two-tags-on-the-same-commit/56039163#56039163

echo "4 ${LAST_RELEASE}"

# shellcheck disable=SC2034
NEXT_RELEASE="$(echo "${LAST_RELEASE}" | awk -F. -v OFS=. '{$NF += 1 ; print}')"

echo "5 ${NEXT_RELEASE}"

# shellcheck disable=SC2034
BRANCH_NAME_TRUNCATED="$(echo "${GITHUB_HEAD_REF}" | cut -c -50 | sed 's/[^a-zA-Z0-9.-]/-/g')" # docker has a 128 character tag limit, so ensuring the branch name will be short enough

echo "6 ${BRANCH_NAME_TRUNCATED}"

# shellcheck disable=SC2034
COMMIT_SHA1_TRUNCATED="$(echo "${GITHUB_SHA}" | cut -c -7)"

echo "7 ${COMMIT_SHA1_TRUNCATED}"
