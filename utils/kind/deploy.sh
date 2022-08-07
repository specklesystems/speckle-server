#!/usr/bin/env bash
set -eox pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
CLUSTER_NAME="speckle"
CLUSTER_CONTEXT="kind-${CLUSTER_NAME}"
SPECKLE_NAMESPACE="speckle"

if kind get clusters | grep -q speckle; then
    kubectl config set-context "${CLUSTER_CONTEXT}"
else
    echo "Deploying kind ✨"
    kind create cluster --name="${CLUSTER_NAME}" --config="${SCRIPT_DIR}/kind-config.yml"
fi

echo "Adding helm repos ☸️"
helm repo add cilium https://helm.cilium.io/
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add bitnami https://charts.bitnami.com/bitnami # postgres, redis, minio
helm repo add runix https://helm.runix.net # pgadmin4
helm repo update

echo "Deploying Cilium CNI to kind cluster 🕸️"

docker pull quay.io/cilium/cilium:v1.12.0
kind load docker-image --name "${CLUSTER_NAME}" quay.io/cilium/cilium:v1.12.0
helm upgrade cilium cilium/cilium --version 1.12.0 \
    --namespace kube-system \
    --install \
    --set kubeProxyReplacement=partial \
    --set socketLB.enabled=false \
    --set externalIPs.enabled=true \
    --set nodePort.enabled=true \
    --set hostPort.enabled=true \
    --set bpf.masquerade=false \
    --set image.pullPolicy=IfNotPresent \
    --set ipam.mode=kubernetes \
    --set hubble.relay.enabled=true \
    --set hubble.ui.enabled=true

echo "Enabling nginx ingress in the kind cluster 🛬"

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

echo "Installing kube-prometheus-stack 📈"

helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --create-namespace \
    --install

echo "Deploying database (Postgres) 💽"

helm upgrade postgres bitnami/postgresql \
    --namespace "${SPECKLE_NAMESPACE}" \
    --create-namespace \
    --install

# postgres-postgresql.speckle.svc.cluster.local
POSTGRES_PASSWORD=$(kubectl get secret --namespace speckle postgres-postgresql -o jsonpath="{.data.postgres-password}" | base64 -d)

echo "Deploying Cache (Redis) 💾"
helm upgrade redis bitnami/redis \
    --namespace "${SPECKLE_NAMESPACE}" \
    --create-namespace \
    --install

# redis-redis-master.speckle.svc.cluster.local # read and write
REDIS_PASSWORD=$(kubectl get secret --namespace speckle redis -o jsonpath="{.data.redis-password}" | base64 -d)

echo "Deploying Blob Storage (minio) 🧱"

set +e
MINIO_ROOT_PASSWORD="$(kubectl get secret --namespace speckle minio -o jsonpath='{.data.root-password}' | base64 -d)"
set -e
if [[ -z "${MINIO_ROOT_PASSWORD}" ]]; then
    helm upgrade minio bitnami/minio \
        --namespace "${SPECKLE_NAMESPACE}" \
        --create-namespace \
        --install
else
    helm upgrade minio bitnami/minio \
        --namespace "${SPECKLE_NAMESPACE}" \
        --create-namespace \
        --set auth.rootPassword="${MINIO_ROOT_PASSWORD}" \
        --install
fi

# minio.speckle.svc.cluster.local
MINIO_ROOT_USER=$(kubectl get secret --namespace speckle minio -o jsonpath="{.data.root-user}" | base64 -d)
MINIO_ROOT_PASSWORD=$(kubectl get secret --namespace speckle minio -o jsonpath="{.data.root-password}" | base64 -d)

echo "Deploying PGAdmin4 🔬"
helm upgrade pgadmin runix/pgadmin4 \
    --namespace "${SPECKLE_NAMESPACE}" \
    --create-namespace \
    --install
