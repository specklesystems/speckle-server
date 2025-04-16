#!/bin/bash
set -eo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

if [[ "${CIRCLE_TAG}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "${CIRCLE_TAG}"
    exit 0
fi

if [[ "${CIRCLE_BRANCH}" == "main" ]]; then
    echo "${NEXT_RELEASE}-alpha.${CIRCLE_BUILD_NUM}"
    exit 0
fi

# if branch name truncated contains an underscore, we should exit
if [[ "${BRANCH_NAME_TRUNCATED}" =~ "_" ]]; then
    echo "Branch name contains an underscore, exiting"
    exit 1
fi

echo "${NEXT_RELEASE}-branch.${BRANCH_NAME_TRUNCATED}.${CIRCLE_BUILD_NUM}-${COMMIT_SHA1_TRUNCATED}"
exit 0
