#!/usr/bin/env bash
set -eo pipefail

GIT_ROOT="$(git rev-parse --show-toplevel)"

export PG_CONNECTION_STRING=postgres://speckle:speckle@localhost/speckle
pushd "${GIT_ROOT}/utils/monitor-deployment"
trap popd EXIT
pip install --disable-pip-version-check --requirement ./requirements.txt
python3 -u src/run.py
