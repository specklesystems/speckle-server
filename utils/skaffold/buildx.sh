#!/bin/sh
set -eo pipefail

# Source: https://github.com/GoogleContainerTools/skaffold/blob/main/examples/custom-buildx/buildx.sh
# License: Apache 2.0
# License source: https://github.com/GoogleContainerTools/skaffold/blob/main/LICENSE
#
# This script uses `docker buildx` to allow Skaffold to build container
# images for different platforms specified in a skaffold yaml
# (or in the environment variable $PLATFORMS, if running this script directly).
# It creates a `docker buildx` builder instance when required.
#
# If you change the platforms, be sure to:
#  (1) delete the buildx builder named `skaffold-builder`.

if [ -z "${1}" ]; then echo "The Dockerfile must be supplied"; exit 1; fi
DOCKERFILE="${1}"

# `buildx` uses named _builder_ instances configured for specific platforms.
# This script creates a `skaffold-builder` as required.
if ! docker buildx inspect skaffold-builder >/dev/null 2>&1; then
  docker buildx create --name skaffold-builder --platform ${PLATFORMS}
fi

# Building for multiple platforms requires pushing to a registry
# as the Docker Daemon cannot load multi-platform images.
if [ "${PUSH_IMAGE}" = true ]; then
  args="--push"
else
  args="--load"
fi

echo "IMAGE: ${IMAGE}"
echo "DOCKERFILE: ${DOCKERFILE}"
echo "BUILD_CONTEXT: ${BUILD_CONTEXT}"

CACHE_DIR="/tmp/speckle_skaffold_buildx_cache"
mkdir -p "${CACHE_DIR}"

docker buildx build \
    --builder skaffold-builder \
    --cache-from type=local,src=${CACHE_DIR} \
    --cache-to   type=local,dest=${CACHE_DIR},mode=max \
    --platform ${PLATFORMS} \
    --file "${DOCKERFILE}" \
    --tag "${IMAGE}" \
    $args \
    ${BUILD_CONTEXT}
