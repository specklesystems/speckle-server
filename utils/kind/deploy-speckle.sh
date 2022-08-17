#!/usr/bin/env bash
set -eox pipefail

GIT_ROOT="$(git rev-parse --show-toplevel)"
CLUSTER_NAME="${CLUSTER_NAME:-speckle}"
CLUSTER_CONTEXT="kind-${CLUSTER_NAME}"
RELEASE_NAME="speckle-test"
SPECKLE_NAMESPACE="${SPECKLE_NAMESPACE:-speckle}"

echo "🏃‍♂️ Deploying speckle helm release to kind"
helm upgrade "${RELEASE_NAME}" "${GIT_ROOT}/utils/helm/speckle-server" \
    --values "${GIT_ROOT}/utils/kind/local.values.yaml" \
    --namespace "${SPECKLE_NAMESPACE}" \
    --kube-context "${CLUSTER_CONTEXT}" \
    --install \
    --create-namespace \
    --debug

# kubectl wait --for=condition=complete --timeout=30s job/myjob

echo "🏅 Speckle is now deployed!"