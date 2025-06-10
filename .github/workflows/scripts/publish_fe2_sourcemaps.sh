#!/usr/bin/env bash
set -eo pipefail

echo "🏷️ Preparing envs"

GIT_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

FE2_DIR_PATH="${FE2_DIR_PATH:-"packages/frontend-2"}"
FE2_DATADOG_SERVICE="${FE2_DATADOG_SERVICE:-"web-app-2"}"
DATADOG_SITE="${DATADOG_SITE:-"datadoghq.eu"}"

if [[ -z "${DATADOG_API_KEY}" ]]; then
  echo "DATADOG_API_KEY is not set"
  exit 1
fi

echo "🏗️ Building prod docker image with sourcemaps enabled"

export DOCKER_BUILDKIT=1
docker build --build-arg BUILD_SOURCEMAPS=true --build-arg SPECKLE_SERVER_VERSION="${IMAGE_VERSION_TAG}" --tag "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}-sourcemaps" --file "${FE2_DIR_PATH}/Dockerfile" .
container_id=$(docker create "${DOCKER_IMAGE_TAG}:${IMAGE_VERSION_TAG}-sourcemaps")

echo "🧹 Cleaning target location and copy sourcemaps into it"

rm -rf "${GIT_ROOT}/${FE2_DIR_PATH}/.output"
docker cp "$container_id":/speckle-server "${GIT_ROOT}/${FE2_DIR_PATH}/.output"
docker rm "$container_id"

echo "🆕 Publishing sourcemaps"

pushd "${GIT_ROOT}/${FE2_DIR_PATH}"
DATADOG_SITE="${DATADOG_SITE}" npx --yes @datadog/datadog-ci sourcemaps upload ./.output/public/_nuxt \
--service="${FE2_DATADOG_SERVICE}" \
--release-version="${IMAGE_VERSION_TAG}" \
--minified-path-prefix=/_nuxt
popd

echo "✅ Sourcemaps completed."

# Clean up
rm -rf "${GIT_ROOT}/${FE2_DIR_PATH}/.output"
