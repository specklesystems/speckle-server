#!/usr/bin/env bash
set -eox pipefail

echo "👷‍♀️ Commencing build of images..."
CLUSTER_NAME="${CLUSTER_NAME:-speckle}"
PUSH_IMAGE="${PUSH_IMAGE:-false}"
IMAGE_TAG="${IMAGE_TAG:-local}"
export PLATFORMS="linux/amd64"
GIT_ROOT="$(git rev-parse --show-toplevel)"
export BUILD_CONTEXT="${GIT_ROOT}"
IMAGE="speckle/speckle-frontend:${IMAGE_TAG}"           "${GIT_ROOT}/utils/build/buildx.sh" "${GIT_ROOT}/packages/frontend/Dockerfile"
IMAGE="speckle/speckle-server:${IMAGE_TAG}"             "${GIT_ROOT}/utils/build/buildx.sh" "${GIT_ROOT}/packages/server/Dockerfile"
IMAGE="speckle/speckle-preview-service:${IMAGE_TAG}"    "${GIT_ROOT}/utils/build/buildx.sh" "${GIT_ROOT}/packages/preview-service/Dockerfile"
IMAGE="speckle/speckle-webhook-service:${IMAGE_TAG}"    "${GIT_ROOT}/utils/build/buildx.sh" "${GIT_ROOT}/packages/webhook-service/Dockerfile"
IMAGE="speckle/speckle-fileimport-service:${IMAGE_TAG}" "${GIT_ROOT}/utils/build/buildx.sh" "${GIT_ROOT}/packages/fileimport-service/Dockerfile"
IMAGE="speckle/speckle-monitor-deployment:${IMAGE_TAG}" "${GIT_ROOT}/utils/build/buildx.sh" "${GIT_ROOT}/utils/monitor-deployment/Dockerfile"
IMAGE="speckle/speckle-test-deployment:${IMAGE_TAG}"    "${GIT_ROOT}/utils/build/buildx.sh" "${GIT_ROOT}/utils/test-deployment/Dockerfile"

unset BUILD_CONTEXT
unset PLATFORMS

echo "Making locally built images available inside kind cluster. This takes a bit to copy, unfortunately..."

kind load docker-image --name="${CLUSTER_NAME}" speckle/speckle-frontend:local
kind load docker-image --name="${CLUSTER_NAME}" speckle/speckle-server:local
kind load docker-image --name="${CLUSTER_NAME}" speckle/speckle-preview-service:local
kind load docker-image --name="${CLUSTER_NAME}" speckle/speckle-webhook-service:local
kind load docker-image --name="${CLUSTER_NAME}" speckle/speckle-fileimport-service:local
kind load docker-image --name="${CLUSTER_NAME}" speckle/speckle-monitor-deployment:local
kind load docker-image --name="${CLUSTER_NAME}" speckle/speckle-test-deployment:local
