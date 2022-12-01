#!/usr/bin/env bash
set -eo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

echo "Starting tagging & publishing of image: ${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}"

echo "💾 Loading image"
docker load --input "/tmp/ci/workspace/${DOCKER_FILE_NAME}"

echo "🐳 Logging into Docker"
echo "${DOCKER_REG_PASS}" | docker login -u "${DOCKER_REG_USER}" --password-stdin "${DOCKER_REG_URL}"
echo "⏫ Pushing loaded image: '${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}'"
docker push "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}"

if [[ "${IMAGE_VERSION_TAG}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-alpha\.[0-9]+)?$ ]]; then
  echo "🏷 Tagging and pushing image as '${DOCKER_IMAGE_TAG}:latest'"
  docker tag "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" "${DOCKER_IMAGE_TAG}:latest"
  docker push "${DOCKER_IMAGE_TAG}:latest"

  if [[ "${IMAGE_VERSION_TAG}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "🏷 Tagging and pushing image as '${DOCKER_IMAGE_TAG}:2'"
    docker tag "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" "${DOCKER_IMAGE_TAG}:2"
    docker push "${DOCKER_IMAGE_TAG}:2"
  fi
else
  BRANCH_TAG="branch.${BRANCH_NAME_TRUNCATED}"
  echo "🏷 Tagging and pushing image as '${DOCKER_IMAGE_TAG}:${BRANCH_TAG}'"
  docker tag "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" "${DOCKER_IMAGE_TAG}:${BRANCH_TAG}"
  docker push "${DOCKER_IMAGE_TAG}:${BRANCH_TAG}"
fi

echo "✅ Publishing completed."
