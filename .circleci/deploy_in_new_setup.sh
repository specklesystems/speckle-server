#!/bin/bash

set -e

K8S_CLUSTER_CERTIFICATE_VARIABLE=K8S_${K8S_CLUSTER}_CERTIFICATE
K8S_CLUSTER_CERTIFICATE=${!K8S_CLUSTER_CERTIFICATE_VARIABLE}

K8S_TOKEN_VARIABLE=K8S_${K8S_CLUSTER}_TOKEN
K8S_TOKEN=${!K8S_TOKEN_VARIABLE}

K8S_SERVER_VARIABLE=K8S_${K8S_CLUSTER}_SERVER
K8S_SERVER=${!K8S_SERVER_VARIABLE}

# K8S_NAMESPACE

IMAGE_VERSION_TAG=$CIRCLE_SHA1

if [[ "$CIRCLE_TAG" =~ ^v.* ]]; then
    IMAGE_VERSION_TAG=$CIRCLE_TAG
fi

echo "$K8S_CLUSTER_CERTIFICATE" | base64 --decode > k8s_cert.crt

# Update deployments
./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  --namespace=$K8S_NAMESPACE \
  set image deployment/speckle-frontend main=$DOCKER_IMAGE_TAG-frontend:$IMAGE_VERSION_TAG

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  --namespace=$K8S_NAMESPACE \
  set image deployment/speckle-server main=$DOCKER_IMAGE_TAG-server:$IMAGE_VERSION_TAG

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  --namespace=$K8S_NAMESPACE \
  set image deployment/speckle-preview-service main=$DOCKER_IMAGE_TAG-preview-service:$IMAGE_VERSION_TAG

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  --namespace=$K8S_NAMESPACE \
  set image deployment/speckle-webhook-service main=$DOCKER_IMAGE_TAG-webhook-service:$IMAGE_VERSION_TAG


# Wait for rollout to complete
./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  --namespace=$K8S_NAMESPACE \
  rollout status -w deployment/speckle-frontend --timeout=3m

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  --namespace=$K8S_NAMESPACE \
  rollout status -w deployment/speckle-server --timeout=3m

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  --namespace=$K8S_NAMESPACE \
  rollout status -w deployment/speckle-preview-service --timeout=3m

./kubectl \
  --kubeconfig=/dev/null \
  --server=$K8S_SERVER \
  --certificate-authority=k8s_cert.crt \
  --token=$K8S_TOKEN \
  --namespace=$K8S_NAMESPACE \
  rollout status -w deployment/speckle-webhook-service --timeout=3m
