#!/bin/bash
set -euo pipefail
# shellcheck disable=SC2016
defined_envs=$(printf '${%s} ' "$(env | cut -d= -f1)")

echo Starting nginx environment template rendering with "${defined_envs}"

envsubst "${defined_envs}" < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/nginx.conf

echo Nginx conf rendered, starting server...
exec "$@"
