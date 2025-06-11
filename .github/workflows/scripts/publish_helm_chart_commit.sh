#!/usr/bin/env bash

set -eo pipefail

echo "🏷️ Setting envs"

GIT_ROOT="$(git rev-parse --show-toplevel)"
GIT_HELM="$(dirname "$GIT_ROOT")/helm"
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

RELEASE_VERSION="${IMAGE_VERSION_TAG}"
HELM_STABLE_BRANCH="${HELM_STABLE_BRANCH:-"main"}"


if [[ -z "${RELEASE_VERSION}" ]]; then
  echo "IMAGE_VERSION_TAG is not set: ${IMAGE_VERSION_TAG} ${RELEASE_VERSION}"
  exit 1
fi
if [ ! -d "${GIT_HELM}/.git" ]; then
  echo "helm repo not found at ${GIT_HELM} "
  exit 1
fi
if [ ! -d "${GIT_ROOT}/.git" ]; then
  echo "speckle repo not found at ${GIT_ROOT}"
  exit 1
fi

echo "✏️ Editing Helm Chart version ${RELEASE_VERSION}"

yq e -i ".version = \"${RELEASE_VERSION}\"" "${GIT_ROOT}/utils/helm/speckle-server/Chart.yaml"
yq e -i ".appVersion = \"${RELEASE_VERSION}\"" "${GIT_ROOT}/utils/helm/speckle-server/Chart.yaml"
yq e -i ".docker_image_tag = \"${RELEASE_VERSION}\"" "${GIT_ROOT}/utils/helm/speckle-server/values.yaml"

if [[ "${GITHUB_REF}" == refs/tags/* || "${GITHUB_REF_NAME}" == "${HELM_STABLE_BRANCH}" ]]; then
  echo "⚠️ prod release ${RELEASE_VERSION}"
  # before overwriting the chart with the build version, check if the current chart version
  # is not newer than the currently build one

  CURRENT_VERSION="$(grep ^version "${GIT_HELM}/charts/speckle-server/Chart.yaml"  | grep -o '2\..*')"
  echo "ℹ️ Current version ${CURRENT_VERSION}"

  "${GIT_ROOT}/.github/workflows/scripts/check_version.py" "${CURRENT_VERSION}" "${RELEASE_VERSION}"
  if [ $? -eq 1 ]
  then
    echo "The current helm chart version '${CURRENT_VERSION}' is newer than the version '${RELEASE_VERSION}' we are attempting to publish. Exiting"
    exit 1
  fi
  rm -rf "${GIT_HELM}/charts/speckle-server"
  cp -r "${GIT_ROOT}/utils/helm/speckle-server" "${GIT_HELM}/charts/speckle-server"
else
  # overwrite the name of the chart
  yq e -i ".name = \"speckle-server-branch-${BRANCH_NAME_TRUNCATED}\"" "${GIT_ROOT}/utils/helm/speckle-server/Chart.yaml"
  rm -rf "${GIT_HELM}/charts/speckle-server-branch-${BRANCH_NAME_TRUNCATED}"
  cp -r "${GIT_ROOT}/utils/helm/speckle-server" "${GIT_HELM}/charts/speckle-server-branch-${BRANCH_NAME_TRUNCATED}"
fi

echo "💾 Pushing commit"

cd "${GIT_HELM}"

git add .
git -c user.email="devops+gha@speckle.systems" -c user.name="CI" commit -m "Github action commit for version '${RELEASE_VERSION}'"
git push
