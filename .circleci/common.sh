#!/usr/bin/env bash
set -eo pipefail

DOCKER_IMAGE_TAG="speckle/speckle-${SPECKLE_SERVER_PACKAGE}"
IMAGE_VERSION_TAG="${IMAGE_VERSION_TAG:-${CIRCLE_SHA1}}"
# shellcheck disable=SC2034,SC2086
DOCKER_FILE_NAME="$(echo ${DOCKER_IMAGE_TAG}_${IMAGE_VERSION_TAG} | sed -e 's/[^A-Za-z0-9._-]/_/g')"
# shellcheck disable=SC2068,SC2046
LAST_RELEASE="$(git describe --always --tags $(git rev-list --tags) | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1)" # get the last release tag. FIXME: Fails if a commit is tagged with more than one tag: https://stackoverflow.com/questions/8089002/git-describe-with-two-tags-on-the-same-commit/56039163#56039163
# shellcheck disable=SC2034
NEXT_RELEASE="$(echo "${LAST_RELEASE}" | awk -F. -v OFS=. '{$NF += 1 ; print}')"
# shellcheck disable=SC2034
BRANCH_NAME_TRUNCATED="$(echo "${CIRCLE_BRANCH}" | cut -c -50 | sed 's/[^a-zA-Z0-9_.-]/_/g')" # docker has a 128 character tag limit, so ensuring the branch name will be short enough
# shellcheck disable=SC2034
COMMIT_SHA1_TRUNCATED="$(echo "${CIRCLE_SHA1}" | cut -c -7)"
