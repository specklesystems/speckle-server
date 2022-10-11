#!/usr/bin/env bash
set -euo pipefail

# set defaults for variables optionally set by flags
SERVICE_NAME="postgres"
VOLUME_NAME="speckle-server_postgres-data"

# parse flags
for i in "$@"; do
  case $i in
    -s=*|--service=*)
      SERVICE_NAME="${i#*=}"
      shift # past argument=value
      ;;
    -v=*|--volume=*)
      VOLUME_NAME="${i#*=}"
      shift # past argument=value
      ;;
    -h|--help)
      echo "===== Postgres purge ====="
      echo "This script will attempt to remove the volume of a postgres"
      echo "database running via docker-compose."
      echo " Usage:"
      echo "        purge.sh"
      echo " Optional flags:"
      echo "            --service=postgres (default: postgres). The name of the docker-compose service running postgres."
      echo "            --volume=speckle-server_postgres-data (default:speckle-server_postgres-data) The name of the docker volume where postgres stores data."
      echo ""
      exit 0
      ;;
    -*)
      echo "Unknown option $i"
      exit 1
      ;;
    *)
      ;;
  esac
done

GIT_ROOT="$(git rev-parse --show-toplevel)"

if ! command -v "docker" &> /dev/null; then
  echo "docker was not found. Please install docker and ensure it is available on your PATH." >&2
  exit 1
fi

if ! docker ps &> /dev/null; then
  echo "docker is not running. Please ensure docker is running."
  exit 1
fi

echo "Stopping docker-compose service: '${SERVICE_NAME}'"
docker-compose --file "${GIT_ROOT}/${DOCKER_COMPOSE_FILE}" stop "${SERVICE_NAME}" --timeout 30

echo "Removing existing volume '${VOLUME_NAME}'"
docker volume rm "${VOLUME_NAME}"
