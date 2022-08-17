#!/bin/bash
set -eo pipefail

SHOULD_BUILD="${SHOULD_BUILD:-false}"
if [[ "${SHOULD_BUILD}" != "true" ]]; then
  echo "Not building as the SHOULD_BUILD environment variable is not 'true'."
  exit 0
fi

# enables building the test-deployment container with the same script
# defaults to packages for minimal intervention in the ci config
FOLDER="${FOLDER:-packages}"

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/common.sh"

echo "Building image: ${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}"

export DOCKER_BUILDKIT=1

docker build --build-arg SPECKLE_SERVER_VERSION="${IMAGE_VERSION_TAG}" --tag "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" --file "${FOLDER}/${SPECKLE_SERVER_PACKAGE}/Dockerfile" .

echo " Saving image"
docker save --output "/tmp/ci/workspace/${DOCKER_FILE_NAME}" "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}"
