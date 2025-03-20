#!/usr/bin/env bash
set -eox pipefail

echo "Running postCreateCommand.sh"

# determine where the script is located, navigate into that directory, then find the root of the git repo in which it is located
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "${SCRIPT_DIR}"
GIT_ROOT="$(git rev-parse --show-toplevel)"

echo "Setting up environment variables by copying .env files"
cp -n "${GIT_ROOT}/packages/server/.env-example" "${GIT_ROOT}/packages/server/.env" || true
cp -n "${GIT_ROOT}/packages/frontend-2/.env.example" "${GIT_ROOT}/packages/frontend-2/.env" || true

echo "Installing nodejs dependencies and building shared packages"
yarn
yarn build:public
