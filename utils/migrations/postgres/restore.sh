#!/usr/bin/env bash
set -euo pipefail

# set defaults for variables set by flags
DB_USER="speckle"
SERVICE_NAME="postgres"
DOCKER_COMPOSE_FILE="docker-compose-deps.yml"
BACKUP_FILE="speckle_postgres_dump.sql"

# parse flags
for i in "$@"; do
  case $i in
    -u=*|--user=*)
      DB_USER="${i#*=}"
      shift # past argument=value
      ;;
    -s=*|--service=*)
      SERVICE_NAME="${i#*=}"
      shift # past argument=value
      ;;
    -d=*|--docker-compose-file=*)
      DOCKER_COMPOSE_FILE="${i#*=}"
      shift # past argument=value
      ;;
    -f=*|--backup-file=*)
      BACKUP_FILE="${i#*=}"
      shift # past argument=value
      ;;
    -h|--help)
      echo "===== Postgres restore ====="
      echo "This script will attempt to restore the contents of a postgres"
      echo "database dump from a SQL file to a postgres database run via"
      echo "docker-compose."
      echo " Usage:"
      echo "        restore.sh"
      echo " Optional flags:"
      echo "            --user=speckle (default: speckle). The database user name."
      echo "            --service=postgres (default: postgres). The docker-compose service that is running postgres."
      echo "            --docker-compose-file=relative/path/from/git/root/to/your/docker-compose-deps.yml (default: ./docker-compose-deps.yml)"
      echo "            --backup-file=path/to/save/your/postgres-database-dump.sql (default: speckle_postgres_dump.sql)"
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

# set internal variables
GIT_ROOT="$(git rev-parse --show-toplevel)"

# check for presence of dependencies
if ! command -v "docker" &> /dev/null; then
  echo "docker was not found. Please install docker and ensure it is available on your PATH." >&2
  exit 1
fi

if ! docker ps &> /dev/null; then
  echo "docker is not running. Please ensure docker is running."
  exit 1
fi

if ! command -v "docker-compose" &> /dev/null; then
  echo "docker-compose was not found. Please install docker-compose and ensure it is available on your PATH."
  exit 1
fi

#shellcheck disable=SC2143
if [ -z "$(docker ps -q --no-trunc | grep "$(docker-compose --file "${GIT_ROOT}/${DOCKER_COMPOSE_FILE}" ps -q "${SERVICE_NAME}")")" ]; then
  echo "The docker-compose service '${SERVICE_NAME}' is not running. Please ensure the service is running. If the service name is different, please provide it as the second argument."
  exit 1
fi

echo "Backing up database from '${BACKUP_FILE}'"
docker-compose --file "${GIT_ROOT}/${DOCKER_COMPOSE_FILE}" exec -T "${SERVICE_NAME}" bash -c "PGPASSWORD=speckle psql -U ${DB_USER}" < "${BACKUP_FILE}"

echo "Postgres backup loaded from: '${BACKUP_FILE}'"
