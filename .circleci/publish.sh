#!/usr/bin/env bash
set -eo pipefail

SHOULD_PUBLISH="${SHOULD_PUBLISH:-false}"

if [[ "${SHOULD_PUBLISH}" != "true" ]]; then
  echo "Not publishing as the SHOULD_PUBLISH environment variable is not 'true'."
  exit 0
fi

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/common.sh"

echo "Publishing: ${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}"

echo "💾 Loading image"
docker load --input "/tmp/ci/workspace/${DOCKER_FILE_NAME}"

echo "🐳 Publishing image"
docker tag "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" "${DOCKER_IMAGE_TAG}:latest"

if [[ "${IMAGE_VERSION_TAG}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  docker tag "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" "${DOCKER_IMAGE_TAG}:2"
fi

echo "${DOCKER_REG_PASS}" | docker login -u "${DOCKER_REG_USER}" --password-stdin "${DOCKER_REG_URL}"
docker push --all-tags "${DOCKER_IMAGE_TAG}"
