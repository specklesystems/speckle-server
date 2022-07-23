# Deploys Speckle Server to a Kind cluster

## Usage

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- [Helm](https://helm.sh/docs/intro/install/)
- (optional, for observing network activity) [Cilium CLI](https://docs.cilium.io/en/stable/gettingstarted/k8s-install-default/#install-the-cilium-cli) and [Hubble](https://github.com/cilium/hubble)

### Create the cluster

1. To deploy a kind cluster and all dependencies, from the repository root directory run:
   ```shell
   yarn kind
   ```

### Delete the cluster

1. From the root directory run:
   ```shell
   yarn kind:delete
   ```

## Description

This utility creates a kubernetes cluster locally with 3 nodes and deploys Cilium CNI. This is intended to replicate DigitalOcean kubernetes setup as closely as possible.

## Viewing network activity

### Using the UI

1. Run cilium command:
   ```shell
   cilium hubble ui
   ```

### Using Hubble CLI

1. Port-forward using Cilium:
   ```shell
   cilium hubble port-forward&
   ```
1. Validate the port-forward and hubble system is working:
   ```shell
   hubble status
   ```
1. Observe traffic using hubble:
   ```shell
   hubble observe
   ```
