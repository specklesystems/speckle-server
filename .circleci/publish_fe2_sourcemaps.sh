#!/usr/bin/env bash
set -eo pipefail

GIT_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

FE2_DIR_PATH="${FE2_DIR_PATH:-"packages/frontend-2"}"
FE2_DATADOG_SERVICE="${FE2_DATADOG_SERVICE:-"web-app-2"}"

if [[ -z "${DATADOG_API_KEY}" ]]; then
  echo "DATADOG_API_KEY is not set"
  exit 1
fi

pushd "${GIT_ROOT}/${FE2_DIR_PATH}"
DATADOG_SITE="${DATADOG_SITE:-"datadoghq.eu"}" yarn datadog-ci sourcemaps upload ./.output/public/_nuxt \
--service="${FE2_DATADOG_SERVICE}" \
--release-version="${IMAGE_VERSION_TAG}" \
--minified-path-prefix=/_nuxt
popd
