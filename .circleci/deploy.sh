#!/bin/bash

set -e


TARGET_SPECKLE_DEPLOYMENT=$SPECKLE_K8S_DEPLOYMENT

IMAGE_VERSION_TAG=$(./.circleci/get_version.sh)


echo "$K8S_CLUSTER_CERTIFICATE" | base64 --decode > k8s_cert.crt

# Update deployments
./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  set image deployment/$TARGET_SPECKLE_DEPLOYMENT-frontend main=$DOCKER_IMAGE_TAG-frontend:$IMAGE_VERSION_TAG

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  set image deployment/$TARGET_SPECKLE_DEPLOYMENT-server main=$DOCKER_IMAGE_TAG-server:$IMAGE_VERSION_TAG

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  set image deployment/$TARGET_SPECKLE_DEPLOYMENT-preview-service main=$DOCKER_IMAGE_TAG-preview-service:$IMAGE_VERSION_TAG

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  set image deployment/$TARGET_SPECKLE_DEPLOYMENT-webhook-service main=$DOCKER_IMAGE_TAG-webhook-service:$IMAGE_VERSION_TAG

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  set image deployment/$TARGET_SPECKLE_DEPLOYMENT-fileimport-service main=$DOCKER_IMAGE_TAG-fileimport-service:$IMAGE_VERSION_TAG

# Wait for rollout to complete
./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  rollout status -w deployment/$TARGET_SPECKLE_DEPLOYMENT-frontend --timeout=10m

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  rollout status -w deployment/$TARGET_SPECKLE_DEPLOYMENT-server --timeout=10m

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  rollout status -w deployment/$TARGET_SPECKLE_DEPLOYMENT-preview-service --timeout=10m

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  rollout status -w deployment/$TARGET_SPECKLE_DEPLOYMENT-webhook-service --timeout=10m

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  rollout status -w deployment/$TARGET_SPECKLE_DEPLOYMENT-fileimport-service --timeout=10m