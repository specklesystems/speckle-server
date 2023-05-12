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
  npm install
popd

pushd "${GIT_ROOT}"
  echo "🏗 Generating the documentation"
  node  "${README_GENERATOR_DIR}/bin/index.js" \
    --config "${GIT_ROOT}/utils/helm/.helm-readme-configuration.json" \
    --values "${GIT_ROOT}/utils/helm/speckle-server/values.yaml" \
    --schema "${JSON_SCHEMA_PATH}"

  yarn prettier:fix:file "${JSON_SCHEMA_PATH}"
popd
