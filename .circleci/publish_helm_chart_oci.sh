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

echo "${DOCKER_REG_PASS}" | helm registry login "${DOCKER_HELM_REG_URL}" --username "${DOCKER_REG_USER}" --password-stdin
helm package "${GIT_REPO}/utils/helm/speckle-server" --version "${RELEASE_VERSION}" --app-version "${RELEASE_VERSION}" --destination "/tmp"
helm push "/tmp/${CHART_NAME}-${RELEASE_VERSION}.tgz" "oci://${DOCKER_HELM_REG_URL}/speckle"
rm "/tmp/${CHART_NAME}-${RELEASE_VERSION}.tgz"

if [[ "${IMAGE_VERSION_TAG}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-alpha\.[0-9]+)?$ ]]; then
  echo "🏷 Tagging and pushing helm chart as 'speckle/${CHART_NAME}:latest'"
  helm package "${GIT_REPO}/utils/helm/speckle-server" --version "latest" --app-version "${RELEASE_VERSION}" --destination "/tmp"
  helm push "/tmp/${CHART_NAME}-latest.tgz" "oci://${DOCKER_HELM_REG_URL}/speckle"
  rm "/tmp/${CHART_NAME}-latest.tgz"

  if [[ "${IMAGE_VERSION_TAG}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "🏷 Tagging and pushing helm chart as 'speckle/${CHART_NAME}:2'"
    helm package "${GIT_REPO}/utils/helm/speckle-server" --version "2" --app-version "${RELEASE_VERSION}" --destination "/tmp"
    helm push "/tmp/${CHART_NAME}-2.tgz" "oci://${DOCKER_HELM_REG_URL}/speckle"
    rm "/tmp/${CHART_NAME}-2.tgz"
  fi
fi
