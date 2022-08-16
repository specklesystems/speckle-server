#!/usr/bin/env bash
set -euox pipefail
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
HELM_GIT_PR_BRANCH="${HELM_GIT_TARGET_BRANCH}-$(openssl rand -hex 6)"

JSON_SCHEMA_PATH="${GIT_ROOT}/utils/helm/speckle-server/values.schema.json"

if [ ! -d "${README_GENERATOR_DIR}" ]; then
  echo "🔭 Could not find readme-generator-for-helm in a sibling directory to speckle-server"
  echo "👩‍👩‍👧‍👧 Proceeding with cloning readme-generator-for-helm to a sibling directory, readme-generator-for-helm"
  git clone git@github.com:bitnami-labs/readme-generator-for-helm.git "${README_GENERATOR_DIR}"
fi

pushd "${README_GENERATOR_DIR}"
  echo "✨ Updating to the latest version of readme-generator-for-helm"
  git switch main
  git pull origin main
popd

if [ ! -d "${HELM_DIR}" ]; then
  echo "🔭 Could not find Speckle Helm in a sibling directory (named speckle-helm) to speckle-server"
  echo "👩‍👩‍👧‍👧 Proceeding with cloning Speckle's helm repository to a sibling directory, speckle-helm"
  git clone git@github.com:specklesystems/helm.git "${HELM_DIR}"
fi

pushd "${HELM_DIR}"
  echo "✨ Updating to the latest version of Speckle helm"
  git switch main
  git pull origin main
  echo "🍽 Preparing forked branch for updates"
  git switch "${HELM_GIT_TARGET_BRANCH}"
  git pull origin "${HELM_GIT_TARGET_BRANCH}"
  git switch -c "${HELM_GIT_PR_BRANCH}"
popd

pushd "${GIT_ROOT}"
  echo "🏗 Generating the documentation"
  node  "${README_GENERATOR_DIR}/bin/index.js" \
    --config "${GIT_ROOT}/utils/helm/.helm-readme-configuration.json" \
    --values "${GIT_ROOT}/utils/helm/speckle-server/values.yaml" \
    --readme "${HELM_DIR}/README.md" \
    --schema "${JSON_SCHEMA_PATH}"

    echo "🐛 Workaround for bug in generator for schema.json: https://github.com/bitnami-labs/readme-generator-for-helm/issues/34"
    TMP_OUTPUT="$(mktemp -t speckle-server-json-schema)"
    jq --arg replacement 'object' '(.. | .items? | select(.type == "")).type |= $replacement' "${JSON_SCHEMA_PATH}" > "${TMP_OUTPUT}" && mv "${TMP_OUTPUT}" "${JSON_SCHEMA_PATH}"
popd

pushd "${HELM_DIR}"
  echo "🌳 Preparing Pull Request for Helm README..."
  git add README.md
  git commit -m "Updating README with revised parameters from values.yaml"
  git push --set-upstream origin "${HELM_GIT_PR_BRANCH}"
  echo "🙏 Please create a Pull Request, ❗️selecting gh-pages as the target branch❗️: https://github.com/specklesystems/helm/pull/new/${HELM_GIT_PR_BRANCH}"
popd
