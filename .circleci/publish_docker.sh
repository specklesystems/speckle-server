#!/usr/bin/env bash
set -eo pipefail

echo "publishing images"
DOCKER_IMAGE_TAG="speckle/speckle-${SPECKLE_SERVER_PACKAGE}"
IMAGE_VERSION_TAG="${IMAGE_VERSION_TAG:-${CIRCLE_SHA1}}"
SANITIZED_FILENAME="$(echo "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" | sed -e 's/[^A-Za-z0-9._-]/_/g')"

docker load --input "/tmp/ci/workspace/${SANITIZED_FILENAME}"
rm "/tmp/ci/workspace/${SANITIZED_FILENAME}"

docker tag "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" "${DOCKER_IMAGE_TAG}:latest"

if [[ "${IMAGE_VERSION_TAG}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    docker tag "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}" "${DOCKER_IMAGE_TAG}:2"
fi

echo "${DOCKER_REG_PASS}" | docker login -u "${DOCKER_REG_USER}" --password-stdin "${DOCKER_REG_URL}"
docker push --all-tags "${DOCKER_IMAGE_TAG}"
