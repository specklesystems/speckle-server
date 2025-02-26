#!/usr/bin/env bash
set -eo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

FE2_DIR_PATH="${FE2_DIR_PATH:-"packages/frontend-2"}"
FE2_DATADOG_SERVICE="${FE2_DATADOG_SERVICE:-"web-app-2"}"
DATADOG_SITE="${DATADOG_SITE:-"datadoghq.eu"}"
OUTPUT_DIR="$(mktemp -d -t fe2-build-output-XXXXXX)"

if [[ -z "${DATADOG_API_KEY}" ]]; then
  echo "DATADOG_API_KEY is not set"
  exit 1
fi

# Build same prod docker image just w/ sourcemaps enabled
export DOCKER_BUILDKIT=1
docker build --build-arg BUILD_SOURCEMAPS=true --build-arg SPECKLE_SERVER_VERSION="${IMAGE_VERSION_TAG}" --tag "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}-sourcemaps" --file "${FE2_DIR_PATH}/Dockerfile" .
container_id=$(docker create "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}-sourcemaps")
docker cp "$container_id":/speckle-server "${OUTPUT_DIR}/.output"
docker rm "$container_id"

# Publish sourcemaps
pushd "${OUTPUT_DIR}"
DATADOG_SITE="${DATADOG_SITE}" npx --yes @datadog/datadog-ci sourcemaps upload ./.output/public/_nuxt \
--service="${FE2_DATADOG_SERVICE}" \
--release-version="${IMAGE_VERSION_TAG}" \
--minified-path-prefix=/_nuxt
popd
