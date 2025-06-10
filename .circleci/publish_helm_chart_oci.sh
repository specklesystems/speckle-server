#!/usr/bin/env bash

set -eo pipefail

if [[ -z "${IMAGE_VERSION_TAG}" ]]; then
  echo "IMAGE_VERSION_TAG is not set"
  exit 1
fi
if [[ -z "${DOCKER_REG_USER}" ]]; then
  echo "DOCKER_REG_USER is not set"
  exit 1
fi
if [[ -z "${DOCKER_REG_PASS}" ]]; then
  echo "DOCKER_REG_PASS is not set"
  exit 1
fi

GIT_REPO=$( pwd )
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

RELEASE_VERSION="${IMAGE_VERSION_TAG}-chart"
HELM_STABLE_BRANCH="${HELM_STABLE_BRANCH:-"main"}"
DOCKER_HELM_REG_URL="${DOCKER_HELM_REG_URL:-"registry-1.docker.io"}"
DOCKER_HELM_REG_ORG="${DOCKER_HELM_REG_ORG:-"speckle"}"
CHART_NAME="${CHART_NAME:-"speckle-server"}"

echo "Releasing Helm Chart version ${RELEASE_VERSION} for application version ${IMAGE_VERSION_TAG}"

yq e -i ".docker_image_tag = \"${IMAGE_VERSION_TAG}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"

echo "${DOCKER_REG_PASS}" | helm registry login "${DOCKER_HELM_REG_URL}" --username "${DOCKER_REG_USER}" --password-stdin
helm package "${GIT_REPO}/utils/helm/speckle-server" --version "${RELEASE_VERSION}" --app-version "${IMAGE_VERSION_TAG}" --destination "/tmp"
helm push "/tmp/${CHART_NAME}-${RELEASE_VERSION}.tgz" "oci://${DOCKER_HELM_REG_URL}/${DOCKER_HELM_REG_ORG}"
