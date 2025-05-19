#!/bin/bash
set -eo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# shellcheck disable=SC1090,SC1091
source "${SCRIPT_DIR}/common.sh"

echo "10 ${SCRIPT_DIR}"

if [[ "${GITHUB_REF}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "${GITHUB_REF}"
    exit 0
fi

echo "11 ${GITHUB_REF}"

if [[ "${GITHUB_HEAD_REF}" == "main" ]]; then
    echo "${NEXT_RELEASE}-alpha.${GITHUB_RUN_ID}"
    exit 0
fi

echo "12 ${GITHUB_HEAD_REF}"

# if branch name truncated contains an underscore, we should exit
if [[ "${BRANCH_NAME_TRUNCATED}" =~ "_" ]]; then
    echo "Branch name contains an underscore, exiting"
    exit 1
fi

echo "13 ${BRANCH_NAME_TRUNCATED}"

echo "${NEXT_RELEASE}-branch.${BRANCH_NAME_TRUNCATED}.${GITHUB_RUN_ID}-${COMMIT_SHA1_TRUNCATED}"
exit 0
