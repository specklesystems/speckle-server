#!/bin/bash
set -eo pipefail

IFS='£' read -r -a PUB_TAGS <<< "${PUBLISHABLE_TAGS}"
# shellcheck disable=SC2068
for item in ${PUB_TAGS[@]}; do
    [[ "${CIRCLE_TAG}" =~ ${item} ]] && echo "true" && exit 0
done

# it's on the main branch
[[ "${CIRCLE_BRANCH}" == "main" ]] && echo "true" && exit 0

# or it is on a branch with a Pull Request
[[ -n "${CIRCLE_PULL_REQUEST}" ]] && echo "true" && exit 0

echo "false"
exit 0
