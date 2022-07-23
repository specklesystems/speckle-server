#!/usr/bin/env bash
set -eox pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
CLUSTER_NAME="speckle"

echo "Deploying kind ✨"
kind create cluster --name="${CLUSTER_NAME}" --config="${SCRIPT_DIR}/kind-config.yml"

echo "Deploying Cilium CNI to kind cluster 🕸️"

docker pull quay.io/cilium/cilium:v1.12.0
kind load docker-image --name "${CLUSTER_NAME}" quay.io/cilium/cilium:v1.12.0
helm repo add cilium https://helm.cilium.io/
helm install cilium cilium/cilium --version 1.12.0 \
   --namespace kube-system \
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
