#!/usr/bin/env bash
set -eo pipefail

DOCKER_IMAGE_TAG="speckle/speckle-${SPECKLE_SERVER_PACKAGE}"
IMAGE_VERSION_TAG="${IMAGE_VERSION_TAG:-${CIRCLE_SHA1}}"
# shellcheck disable=SC2034,SC2086
DOCKER_FILE_NAME="$(echo ${DOCKER_IMAGE_TAG}_${IMAGE_VERSION_TAG} | sed -e 's/[^A-Za-z0-9._-]/_/g')"
