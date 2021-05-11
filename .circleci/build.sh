#!/bin/bash

set -e

DOCKER_IMAGE_TAG=$DOCKER_IMAGE_TAG-$SPECKLE_SERVER_PACKAGE

IMAGE_VERSION_TAG=$CIRCLE_SHA1

if [[ "$CIRCLE_TAG" =~ ^v.* ]]; then
    IMAGE_VERSION_TAG=$CIRCLE_TAG
fi

docker build --build-arg SPECKLE_SERVER_VERSION=$IMAGE_VERSION_TAG -t $DOCKER_IMAGE_TAG:latest . -f packages/$SPECKLE_SERVER_PACKAGE/Dockerfile
docker tag $DOCKER_IMAGE_TAG:latest $DOCKER_IMAGE_TAG:$IMAGE_VERSION_TAG

echo "$DOCKER_REG_PASS" | docker login -u "$DOCKER_REG_USER" --password-stdin $DOCKER_REG_URL
docker push $DOCKER_IMAGE_TAG:latest
docker push $DOCKER_IMAGE_TAG:$IMAGE_VERSION_TAG

if [[ "$CIRCLE_TAG" =~ ^v.* ]]; then
  docker tag $DOCKER_IMAGE_TAG:latest $DOCKER_IMAGE_TAG:2
  docker push $DOCKER_IMAGE_TAG:2
fi
