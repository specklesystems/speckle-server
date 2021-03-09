#!/bin/bash

set -e

TARGET_SPECKLE_DEPLOYMENT=$SPECKLE_K8S_DEPLOYMENT
IMAGE_VERSION_TAG=$CIRCLE_SHA1

if [[ "$CIRCLE_TAG" =~ ^v.* ]]; then
    TARGET_SPECKLE_DEPLOYMENT=$SPECKLE_K8S_DEPLOYMENT_PROD
    IMAGE_VERSION_TAG=$CIRCLE_TAG
fi

docker build -t $DOCKER_IMAGE_TAG:latest . -f .circleci/Dockerfile
docker tag $DOCKER_IMAGE_TAG:latest $DOCKER_IMAGE_TAG:$IMAGE_VERSION_TAG

echo "$DOCKER_REG_PASS" | docker login -u "$DOCKER_REG_USER" --password-stdin $DOCKER_REG_URL
docker push $DOCKER_IMAGE_TAG:latest
docker push $DOCKER_IMAGE_TAG:$IMAGE_VERSION_TAG

echo "$K8S_CLUSTER_CERTIFICATE" | base64 --decode > k8s_cert.crt


./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  set image deployment/$TARGET_SPECKLE_DEPLOYMENT main=$DOCKER_IMAGE_TAG:$IMAGE_VERSION_TAG

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  rollout status -w deployment/$TARGET_SPECKLE_DEPLOYMENT --timeout=1m
