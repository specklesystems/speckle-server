#!/usr/bin/env bash
set -eo pipefail

SHOULD_PUBLISH="${SHOULD_PUBLISH:-false}"

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

echo "💾 Loading image: ${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}"
docker load --input "/tmp/ci/workspace/${DOCKER_FILE_NAME}"

if [[ "${SHOULD_PUBLISH}" == "true" ]]; then
  echo "🐳 Tagging image as '${DOCKER_IMAGE_TAG}:latest'"
  docker tag "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" "${DOCKER_IMAGE_TAG}:latest"

  if [[ "${IMAGE_VERSION_TAG}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "🐳 Tagging image as '${DOCKER_IMAGE_TAG}:2'"
    docker tag "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" "${DOCKER_IMAGE_TAG}:2"
  fi
fi

echo "Publishing all tags of: ${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}"
echo "${DOCKER_REG_PASS}" | docker login -u "${DOCKER_REG_USER}" --password-stdin "${DOCKER_REG_URL}"
docker push --all-tags "${DOCKER_IMAGE_TAG}"
