#!/bin/bash
set -euo pipefail
# shellcheck disable=SC2016,SC2046
defined_envs=$(printf '${%s} ' $(env | cut -d= -f1))

echo Starting nginx environment template rendering with "${defined_envs}"

cp /opt/bitnami/openresty/nginx/mime.types /opt/bitnami/openresty/nginx/conf/mime.types
envsubst "${defined_envs}" < /opt/bitnami/openresty/nginx/templates/nginx.conf.template > /opt/bitnami/openresty/nginx/conf/nginx.conf

echo Nginx conf rendered, starting server...
exec "$@"
