#!/bin/bash

set -e

LAST_RELEASE=$(git describe --always --tags `git rev-list --tags` | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1)
NEXT_RELEASE=$(echo ${LAST_RELEASE} | python -c "parts = input().split('.'); parts[-1] = str(int(parts[-1])+1); print('.'.join(parts))")

if [[ "$CIRCLE_TAG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo $CIRCLE_TAG
    exit 0
fi

echo "$NEXT_RELEASE-alpha.$CIRCLE_BUILD_NUM"
exit 0
