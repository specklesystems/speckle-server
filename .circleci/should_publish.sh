#!/usr/bin/env bash
set -eo pipefail

IFS='£' read -r -a PUB_TAGS <<< "${PUBLISHABLE_TAGS}"
# shellcheck disable=SC2068
for item in ${PUB_TAGS[@]}; do
    [[ "${CIRCLE_TAG}" =~ ${item} ]] && echo "true" && exit 0
done

IFS='£' read -r -a PUB_BRANCHES <<< "${PUBLISHABLE_BRANCHES}"
# shellcheck disable=SC2068
for item in ${PUB_BRANCHES[@]}; do
    [[ "${CIRCLE_BRANCH}" =~ ${item} ]] && echo "true" && exit 0
done

echo "false"
exit 0
