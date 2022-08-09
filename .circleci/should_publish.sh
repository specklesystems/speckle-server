#!/usr/bin/env bash
set -eo pipefail

IFS='£' read -a PUB_TAGS <<< "${PUBLISHABLE_TAGS}"
for item in ${PUB_TAGS[@]}; do
    [[ "${CIRCLE_TAG}" =~ ${item} ]] && echo "true" && exit 0
done

IFS='£' read -a PUB_BRANCHES <<< "${PUBLISHABLE_BRANCHES}"
for item in ${PUB_BRANCHES[@]}; do
    [[ "${CIRCLE_BRANCH}" =~ ${item} ]] && echo "true" && exit 0
done

echo "false"
exit 0
