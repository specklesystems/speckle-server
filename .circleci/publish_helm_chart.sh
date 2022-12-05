#!/usr/bin/env bash

set -eo pipefail
set -x # FIXME temporarily while testing

# HACK retains blank lines in yq edited yaml files
# https://github.com/mikefarah/yq/issues/515#issuecomment-1113957629
yqblank() {
  yq "$1" "$2" | diff -B "$2" - | patch "$2" -
}

GIT_REPO=$( pwd )
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

RELEASE_VERSION="${IMAGE_VERSION_TAG}"
HELM_STABLE_BRANCH="${HELM_STABLE_BRANCH:-"main"}"

echo "Releasing Helm Chart version ${RELEASE_VERSION}"

git config --global user.email "devops+circleci@speckle.systems"
git config --global user.name "CI"


git clone git@github.com:specklesystems/helm.git "${HOME}/helm"

yqblank ".version = \"${RELEASE_VERSION}\"" "${GIT_REPO}/utils/helm/speckle-server/Chart.yaml"
yqblank ".appVersion = \"${RELEASE_VERSION}\"" "${GIT_REPO}/utils/helm/speckle-server/Chart.yaml"
yqblank ".docker_image_tag = \"${RELEASE_VERSION}\"" "${GIT_REPO}/utils/helm/speckle-server/values.yaml"

rm -rf "${HOME}/helm/charts/speckle-server"
if [[ -n "${CIRCLE_TAG}" || "${CIRCLE_BRANCH}" == "${HELM_STABLE_BRANCH}" ]]; then
  # before overwriting the chart with the build version, check if the current chart version
  # is not newer than the currently build one

  CURRENT_VERSION="$(grep ^version "${HOME}/helm/charts/speckle-server/Chart.yaml"  | grep -o '2\..*')"
  echo "${CURRENT_VERSION}"

  .circleci/check_version.py "${CURRENT_VERSION}" "${RELEASE_VERSION}"
  if [ $? -eq 1 ]
  then
    echo "The current helm chart version is newer than the currently built. Exiting" 
    exit 1
  fi
  cp -r "${GIT_REPO}/utils/helm/speckle-server" "${HOME}/helm/charts/speckle-server"
else
  # overwrite the name of the chart
  yqblank ".name = \"${BRANCH_NAME_TRUNCATED}-speckle-server\"" "${GIT_REPO}/utils/helm/speckle-server/Chart.yaml"
  cp -r "${GIT_REPO}/utils/helm/speckle-server" "${HOME}/helm/charts/${BRANCH_NAME_TRUNCATED}-speckle-server"
fi

cd ~/helm

git add .
git diff --staged # FIXME temporarily while testing
git commit -m "CircleCI commit for version '${RELEASE_VERSION}'"
# git push # FIXME temporarily disable while testing
