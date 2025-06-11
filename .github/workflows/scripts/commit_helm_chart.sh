#!/usr/bin/env bash

set -eo pipefail

echo "🏷️ Setting envs"

GIT_REPO=$( pwd )
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

RELEASE_VERSION="${IMAGE_VERSION_TAG}"
HELM_STABLE_BRANCH="${HELM_STABLE_BRANCH:-"main"}"

if [ ! -d "${HOME}/helm" ]; then
  echo "${HOME}/helm dir not found"
  exit 1
fi
if [ ! -d "${GIT_REPO}" ]; then
  echo "${GIT_REPO} speckle repo not found"
  exit 1
fi

echo "✏️ Editing Helm Chart version ${RELEASE_VERSION}"

yq e -i ".version = \"${RELEASE_VERSION}\"" "${GIT_REPO}/utils/helm/speckle-server/Chart.yaml"
yq e -i ".appVersion = \"${RELEASE_VERSION}\"" "${GIT_REPO}/utils/helm/speckle-server/Chart.yaml"
yq e -i ".docker_image_tag = \"${RELEASE_VERSION}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"

if [[ "${GITHUB_REF}" == refs/tags/* || "${GITHUB_REF_NAME}" == "${HELM_STABLE_BRANCH}" ]]; then
  echo "⚠️ prod release ${RELEASE_VERSION}"
  # before overwriting the chart with the build version, check if the current chart version
  # is not newer than the currently build one

  CURRENT_VERSION="$(grep ^version "${HOME}/helm/charts/speckle-server/Chart.yaml"  | grep -o '2\..*')"
  echo "ℹ️ Current version ${CURRENT_VERSION}"

  .github/workflows/scripts/check_version.py "${CURRENT_VERSION}" "${RELEASE_VERSION}"
  if [ $? -eq 1 ]
  then
    echo "The current helm chart version '${CURRENT_VERSION}' is newer than the version '${RELEASE_VERSION}' we are attempting to publish. Exiting"
    exit 1
  fi
  rm -rf "${HOME}/helm/charts/speckle-server"
  cp -r "${GIT_REPO}/utils/helm/speckle-server" "${HOME}/helm/charts/speckle-server"
else
  # overwrite the name of the chart
  yq e -i ".name = \"speckle-server-branch-${BRANCH_NAME_TRUNCATED}\"" "${GIT_REPO}/utils/helm/speckle-server/Chart.yaml"
  rm -rf "${HOME}/helm/charts/speckle-server-branch-${BRANCH_NAME_TRUNCATED}"
  cp -r "${GIT_REPO}/utils/helm/speckle-server" "${HOME}/helm/charts/speckle-server-branch-${BRANCH_NAME_TRUNCATED}"
fi

echo "💾 Pushing commit"

cd ~/helm

cat ${HOME}/helm/charts/speckle-server-branch-${BRANCH_NAME_TRUNCATED}

#git add .
#git -c user.email="devops+circleci@speckle.systems" -c user.name="CI" commit -m "CircleCI commit for version '${RELEASE_VERSION}'"
#git push
