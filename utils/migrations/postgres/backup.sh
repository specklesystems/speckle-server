#!/usr/bin/env bash
set -euo pipefail

# define defaults for variables optionally set from flags
DB_USER="speckle"
SERVICE_NAME="postgres"
DOCKER_COMPOSE_FILE="docker-compose-deps.yml"
OUTPUT_PATH="speckle_postgres_dump_$(date +%Y-%m-%d_%H_%M_%S).sql"
DBDUMP_ARGS="-c"

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
    -o=*|--output-path=*)
      OUTPUT_PATH="${i#*=}"
      shift # past argument=value
      ;;
    --clear=false)
      DBDUMP_ARGS=""
      shift # past argument
      ;;
    -h|--help)
      echo "===== Postgres backup ====="
      echo "This script will attempt to dump all the contents of a postgres"
      echo "database running via docker-compose into a SQL file."
      echo " Usage:"
      echo "        backup.sh"
      echo " Optional flags:"
      echo "            --user=speckle (default: speckle). The database user name."
      echo "            --service=postgres (default: postgres). The docker-compose service name that is running postgres."
      echo "            --docker-compose-file=relative/path/from/git/root/to/your/docker-compose-deps.yml (default: ./docker-compose-deps.yml)"
      echo "            --output-path=path/to/save/your/postgres-database-dump.sql (default: speckle_postgres_dump_<date_time>.sql)"
      echo "            --clear=false (default: true). The database dump, when loaded into another database will clear its existing data)"
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

if ! command -v "docker-compose" &> /dev/null; then
  echo "docker-compose was not found. Please install docker-compose and ensure it is available on your PATH."
  exit 1
fi

#shellcheck disable=SC2143
if [ -z "$(docker ps -q --no-trunc | grep "$(docker-compose --file "${GIT_ROOT}/${DOCKER_COMPOSE_FILE}" ps -q "${SERVICE_NAME}")")" ]; then
  echo "The docker-compose service '${SERVICE_NAME}' is not running. Please ensure the service is running. If the service name is different, please provide it as the second argument."
  exit 1
fi

echo "Backing up database to: '${OUTPUT_PATH}'"
#shellcheck disable=SC2027,SC2086
docker-compose --file "${GIT_ROOT}/${DOCKER_COMPOSE_FILE}" exec "${SERVICE_NAME}" pg_dumpall ${DBDUMP_ARGS} -U "${DB_USER}" > "${OUTPUT_PATH}"

echo "Postgres backup saved to: '${OUTPUT_PATH}'"
