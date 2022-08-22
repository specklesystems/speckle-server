#!/bin/bash
set -eo pipefail

# it's on the main branch
[[ "${CIRCLE_BRANCH}" == "main" ]] && echo "true" && exit 0

# or it is on a branch with a Pull Request
[[ -n "${CIRCLE_PULL_REQUEST}" ]] && echo "true" && exit 0

echo "false"
circleci-agent step halt
exit 0
