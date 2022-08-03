#!/bin/bash
set -eo pipefail

# enables building the test-deployment container with the same script
# defaults to packages for minimal intervention in the ci config
FOLDER="${FOLDER:-packages}"
PUBLISH_IMAGES="${PUBLISH_IMAGES:-false}"

DOCKER_IMAGE_TAG="speckle/speckle-${SPECKLE_SERVER_PACKAGE}"

# IMAGE_VERSION_TAG=$(./.circleci/get_version.sh)
# if there is not image version tag, uses the SHA1 of the last git commit of the branch that triggered this build
IMAGE_VERSION_TAG="${IMAGE_VERSION_TAG:-${CIRCLE_SHA1}}"
echo "${IMAGE_VERSION_TAG}"

export DOCKER_BUILDKIT=1

docker build --build-arg SPECKLE_SERVER_VERSION="${IMAGE_VERSION_TAG}" -t "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" . --file "${FOLDER}/${SPECKLE_SERVER_PACKAGE}/Dockerfile"

SANITIZED_FILENAME="$(echo "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" | sed -e 's/[^A-Za-z0-9._-]/_/g')"

mkdir -p "/tmp/ci/workspace/images"
docker save "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" --output "/tmp/ci/workspace/images/${SANITIZED_FILENAME}"
