#!/bin/bash

set -e

# TAG_VER=2.0.$CIRCLE_BUILD_NUM

docker build -t $DOCKER_IMAGE_TAG:latest . -f .circleci/Dockerfile
docker tag $DOCKER_IMAGE_TAG:latest $DOCKER_IMAGE_TAG:$CIRCLE_SHA1

echo "$DOCKER_REG_PASS" | docker login -u "$DOCKER_REG_USER" --password-stdin $DOCKER_REG_URL
docker push $DOCKER_IMAGE_TAG:latest
docker push $DOCKER_IMAGE_TAG:$CIRCLE_SHA1

echo "$K8S_CLUSTER_CERTIFICATE" | base64 --decode > k8s_cert.crt

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  set image deployment/$SPECKLE_K8S_DEPLOYMENT main=$DOCKER_IMAGE_TAG:$CIRCLE_SHA1

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  rollout status -w deployment/$SPECKLE_K8S_DEPLOYMENT --timeout=1m
