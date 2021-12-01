#!/bin/bash

set -e

LAST_RELEASE=$(git describe --always --tags `git rev-list --tags` | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1)
NEXT_RELEASE=$(echo ${LAST_RELEASE} | awk -F. -v OFS=. '{$NF++;print}')

if [[ "$CIRCLE_TAG" == "$LAST_RELEASE" ]]; then
    echo $LAST_RELEASE
    exit 0
fi

echo "$NEXT_RELEASE-alpha.$CIRCLE_BUILD_NUM"
exit 0
