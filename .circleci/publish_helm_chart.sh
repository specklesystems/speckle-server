#!/usr/bin/env bash

set -eo pipefail

GIT_REPO=$( pwd )
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

RELEASE_VERSION="${IMAGE_VERSION_TAG}"
HELM_STABLE_BRANCH="${HELM_STABLE_BRANCH:-"main"}"

echo "Releasing Helm Chart version ${RELEASE_VERSION}"

git clone git@github.com:specklesystems/helm.git "${HOME}/helm"

yq e -i ".version = \"${RELEASE_VERSION}\"" "${GIT_REPO}/utils/helm/speckle-server/Chart.yaml"
yq e -i ".appVersion = \"${RELEASE_VERSION}\"" "${GIT_REPO}/utils/helm/speckle-server/Chart.yaml"
yq e -i ".docker_image_tag = \"${RELEASE_VERSION}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"

if [[ -n "${CIRCLE_TAG}" || "${CIRCLE_BRANCH}" == "${HELM_STABLE_BRANCH}" ]]; then
  # before overwriting the chart with the build version, check if the current chart version
  # is not newer than the currently build one

  CURRENT_VERSION="$(grep ^version "${HOME}/helm/charts/speckle-server/Chart.yaml"  | grep -o '2\..*')"
  echo "${CURRENT_VERSION}"

  .circleci/check_version.py "${CURRENT_VERSION}" "${RELEASE_VERSION}"
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

cd ~/helm

git add .
git -c user.email="devops+circleci@speckle.systems" -c user.name="CI" commit -m "CircleCI commit for version '${RELEASE_VERSION}'"
git push
