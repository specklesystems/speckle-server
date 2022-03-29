#!/bin/bash

set -e

# enables building the test-deployment container with the same script
# defaults to packages for minimal intervention in the ci config
FOLDER="${FOLDER:-packages}"

DOCKER_IMAGE_TAG=speckle/speckle-$SPECKLE_SERVER_PACKAGE

IMAGE_VERSION_TAG=$(./.circleci/get_version.sh)

docker build --build-arg SPECKLE_SERVER_VERSION=$IMAGE_VERSION_TAG -t $DOCKER_IMAGE_TAG:latest . -f $FOLDER/$SPECKLE_SERVER_PACKAGE/Dockerfile

docker tag $DOCKER_IMAGE_TAG:latest $DOCKER_IMAGE_TAG:$IMAGE_VERSION_TAG

if [[ "$IMAGE_VERSION_TAG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  docker tag $DOCKER_IMAGE_TAG:2
fi

echo "$DOCKER_REG_PASS" | docker login -u "$DOCKER_REG_USER" --password-stdin $DOCKER_REG_URL
docker push -a
