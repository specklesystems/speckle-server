#!/usr/bin/env bash
set -eou pipefail
kubectl apply  --filename="./manifests/coredns.configmap.yaml" --context="kind-speckle-server"
kubectl --context="kind-speckle-server" --namespace="kube-system" rollout restart deployment/coredns
kubectl --context="kind-speckle-server" --namespace="kube-system" rollout status deployment "coredns" --timeout=90s
