#!/usr/bin/env bash
set -euo pipefail
if ! command -v node &> /dev/null
then
    echo "🛑 node could not be found. Please install node (and ensure it is in your PATH) before trying again."
    exit 1
fi

if ! command -v git &> /dev/null
then
    echo "🛑 git could not be found. Please install git (and ensure it is in your PATH) before trying again."
    exit 1
fi

GIT_ROOT="$(git rev-parse --show-toplevel)"

README_GENERATOR_DIR="${GIT_ROOT}/../readme-generator-for-helm"
HELM_DIR="${GIT_ROOT}/../speckle-helm"
HELM_GIT_TARGET_BRANCH="gh-pages"

if [ ! -d "${README_GENERATOR_DIR}" ]; then
  echo "🔭 Could not find 'readme-generator-for-helm' in a sibling directory"
  echo "👩‍👩‍👧‍👧 Proceeding with cloning readme-generator-for-helm to a sibling directory, 'readme-generator-for-helm'"
  git clone git@github.com:bitnami-labs/readme-generator-for-helm.git "${README_GENERATOR_DIR}"
fi

if [ -n "${CI}" ]; then
  git config --global user.email "devops+circleci@speckle.systems"
  git config --global user.name "CI"
fi

pushd "${README_GENERATOR_DIR}"
  echo "✨ Updating to the latest version of readme-generator-for-helm"
  git switch main
  git pull origin main
  npm install
popd

if [ ! -d "${HELM_DIR}" ]; then
  echo "🔭 Could not find Speckle Helm in a sibling directory (named 'speckle-helm')"
  echo "👩‍👩‍👧‍👧 Proceeding with cloning Speckle's helm repository to a sibling directory, 'speckle-helm'"
  git clone git@github.com:specklesystems/helm.git "${HELM_DIR}"
fi

pushd "${HELM_DIR}"
  echo "✨ Updating to the latest version of Speckle helm"
  git switch main
  git pull origin main
  echo "🍽 Preparing gh-pages branch for updates"
  git switch "${HELM_GIT_TARGET_BRANCH}"
  git pull origin "${HELM_GIT_TARGET_BRANCH}"
popd

pushd "${GIT_ROOT}"
  echo "🏗 Generating the documentation"
  node  "${README_GENERATOR_DIR}/bin/index.js" \
    --config "${GIT_ROOT}/utils/helm/.helm-readme-configuration.json" \
    --values "${GIT_ROOT}/utils/helm/speckle-server/values.yaml" \
    --readme "${HELM_DIR}/README.md"
popd

pushd "${HELM_DIR}"
  echo "🌳 Preparing commit to branch '${HELM_GIT_TARGET_BRANCH}' for Helm README..."
  if [[ $(git status --porcelain) ]]; then
    git add README.md
    git commit -m "Updating README with revised parameters from values.yaml of Helm Chart."
    git push --set-upstream origin "${HELM_GIT_TARGET_BRANCH}"
  fi
popd

echo "✅ All done 🎉"
