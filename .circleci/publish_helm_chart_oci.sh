#!/usr/bin/env bash

set -eo pipefail

GIT_REPO=$( pwd )
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

RELEASE_VERSION="${IMAGE_VERSION_TAG}"
HELM_STABLE_BRANCH="${HELM_STABLE_BRANCH:-"main"}"

echo "Releasing Helm Chart version ${RELEASE_VERSION}"

yq e -i ".docker_image_tag = \"${RELEASE_VERSION}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"

if [[ -n "${CIRCLE_TAG}" || "${CIRCLE_BRANCH}" == "${HELM_STABLE_BRANCH}" ]]; then
  # before overwriting the chart with the build version, check if the current chart version
  # is not newer than the currently build one

  helm pull "oci://${DOCKER_HELM_REG_URL}/speckle/speckle-server-chart" --destination "/tmp/old-version" --untar --untardir "untar"
  CURRENT_VERSION="$(yq .version "/tmp/old-version/untar/speckle-server-chart/Chart.yaml")"
  echo "${CURRENT_VERSION}"
  rm -rf "/tmp/old-version"

  .circleci/check_version.py "${CURRENT_VERSION}" "${RELEASE_VERSION}"
  if [ $? -eq 1 ]
  then
    echo "The current helm chart version '${CURRENT_VERSION}' is newer than the version '${RELEASE_VERSION}' we are attempting to publish. Exiting"
    exit 1
  fi
fi

echo "${DOCKER_REG_PASS}" | helm registry login "${DOCKER_HELM_REG_URL}" --username "${DOCKER_REG_USER}" --password-stdin
helm package "${GIT_REPO}/utils/helm/speckle-server" --version "${RELEASE_VERSION}" --app-version "${RELEASE_VERSION}" --destination "/tmp"
helm push "/tmp/${CHART_NAME}-${RELEASE_VERSION}.tgz" "oci://${DOCKER_HELM_REG_URL}/speckle"
