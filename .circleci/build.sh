#!/bin/bash
set -euo pipefail

# enables building the test-deployment container with the same script
# defaults to packages for minimal intervention in the ci config
FOLDER="${FOLDER:-packages}"
PUBLISH_IMAGES="${PUBLISH_IMAGES:-false}"

DOCKER_IMAGE_TAG="speckle/speckle-${SPECKLE_SERVER_PACKAGE}"

# IMAGE_VERSION_TAG=$(./.circleci/get_version.sh)
IMAGE_VERSION_TAG="${IMAGE_VERSION_TAG:-0}"
echo "${IMAGE_VERSION_TAG}"

export DOCKER_BUILDKIT=1

docker build --build-arg SPECKLE_SERVER_VERSION="${IMAGE_VERSION_TAG}" -t "${DOCKER_IMAGE_TAG}:latest" . -f "${FOLDER}/${SPECKLE_SERVER_PACKAGE}/Dockerfile"

if [[ "${PUBLISH_IMAGES}" == "true" ]]; then
  docker tag "${DOCKER_IMAGE_TAG}:latest" "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}"

  if [[ "${IMAGE_VERSION_TAG}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    docker tag "${DOCKER_IMAGE_TAG}:latest" "${DOCKER_IMAGE_TAG}:2"
  fi

  echo "${DOCKER_REG_PASS}" | docker login -u "${DOCKER_REG_USER}" --password-stdin "${DOCKER_REG_URL}"
  docker push -a "${DOCKER_IMAGE_TAG}"
fi
