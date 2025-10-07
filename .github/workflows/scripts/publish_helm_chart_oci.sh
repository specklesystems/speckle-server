#!/usr/bin/env bash

set -eo pipefail

if [[ -z "${IMAGE_PREFIX}" ]]; then
  echo "IMAGE_PREFIX is not set"
  exit 1
fi
if [[ -z "${IMAGE_VERSION_TAG}" ]]; then
  echo "IMAGE_VERSION_TAG is not set"
  exit 1
fi
if [[ -z "${REGISTRY_USERNAME}" ]]; then
  echo "REGISTRY_USERNAME is not set"
  exit 1
fi
if [[ -z "${REGISTRY_PASSWORD}" ]]; then
  echo "REGISTRY_PASSWORD is not set"
  exit 1
fi
if [[ -z "${HELM_REGISTRY_DOMAIN}" ]]; then
  echo "HELM_REGISTRY_DOMAIN is not set"
  exit 1
fi
if [[ -z "${HELM_REPOSITORY_PATH}" ]]; then
  echo "HELM_REPOSITORY_PATH is not set"
  exit 1
fi

RELEASE_VERSION="${IMAGE_VERSION_TAG}"
HELM_STABLE_BRANCH="${HELM_STABLE_BRANCH:-"main"}"
CHART_NAME="${CHART_NAME:-"speckle-server-chart"}"

echo "🏷️ Preparing envs"

GIT_REPO=$( pwd )
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

echo "📌 Releasing Helm Chart for application version ${IMAGE_VERSION_TAG} to 'oci://${HELM_REGISTRY_DOMAIN}/${HELM_REPOSITORY_PATH}/${CHART_NAME}:${RELEASE_VERSION}'"

if [[ "${IMAGE_PREFIX}" != "speckle" ]]; then
  yq e -i ".server.image = \"${IMAGE_PREFIX}/speckle-server:${IMAGE_VERSION_TAG}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"
  yq e -i ".objects.image = \"${IMAGE_PREFIX}/speckle-server:${IMAGE_VERSION_TAG}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"
  yq e -i ".frontend_2.image = \"${IMAGE_PREFIX}/speckle-frontend-2:${IMAGE_VERSION_TAG}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"
  yq e -i ".preview_service.image = \"${IMAGE_PREFIX}/speckle-preview-service:${IMAGE_VERSION_TAG}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"
  yq e -i ".webhook_service.image = \"${IMAGE_PREFIX}/speckle-webhook-service:${IMAGE_VERSION_TAG}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"
  yq e -i ".fileimport_service.image = \"${IMAGE_PREFIX}/speckle-fileimport-service:${IMAGE_VERSION_TAG}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"
  yq e -i ".ifc_import_service.image = \"${IMAGE_PREFIX}/speckle-ifc-import-service:${IMAGE_VERSION_TAG}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"
  yq e -i ".monitoring.image = \"${IMAGE_PREFIX}/speckle-monitor-deployment:${IMAGE_VERSION_TAG}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"
  yq e -i ".test.image = \"${IMAGE_PREFIX}/speckle-test-deployment:${IMAGE_VERSION_TAG}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"
fi

yq e -i ".docker_image_tag = \"${IMAGE_VERSION_TAG}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"
yq e -i ".name = \"${CHART_NAME}\"" "${GIT_REPO}/utils/helm/speckle-server/Chart.yaml"

echo "Logging in to Helm registry ${HELM_REGISTRY_DOMAIN} with user ${REGISTRY_USERNAME}. Password: ****${REGISTRY_PASSWORD: -3}"
echo "${REGISTRY_PASSWORD}" | helm registry login "${HELM_REGISTRY_DOMAIN}" --username "${REGISTRY_USERNAME}" --password-stdin
helm package "${GIT_REPO}/utils/helm/speckle-server" --version "${RELEASE_VERSION}" --app-version "${IMAGE_VERSION_TAG}" --destination "/tmp"
echo "Publishing chart to oci://${HELM_REGISTRY_DOMAIN}/${HELM_REPOSITORY_PATH}/${CHART_NAME}"
helm push "/tmp/${CHART_NAME}-${RELEASE_VERSION}.tgz" "oci://${HELM_REGISTRY_DOMAIN}/${HELM_REPOSITORY_PATH}"
