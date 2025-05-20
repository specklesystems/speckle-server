#!/bin/bash
set -eo pipefail

# enables building the test-deployment container with the same script
# defaults to packages for minimal intervention in the ci config
FOLDER="${FOLDER:-packages}"

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

echo "Building image: ${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}"

export DOCKER_BUILDKIT=1

docker build --build-arg SPECKLE_SERVER_VERSION="${IMAGE_VERSION_TAG}" --tag "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" --file "${FOLDER}/${SPECKLE_SERVER_PACKAGE}/Dockerfile" .

echo "🐳 Logging into Docker"
echo "${DOCKER_REG_PASS}" | docker login -u "${DOCKER_REG_USER}" --password-stdin "${DOCKER_REG_URL}"

echo "⏫ Pushing image: '${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}'"
docker push "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}"
