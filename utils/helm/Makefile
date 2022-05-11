# This file is only useful to test the helm chart locally with minikube before committing changes

build:
	cd ../.. && docker build -t speckle/speckle-frontend:local -f packages/frontend/Dockerfile .
	cd ../.. && docker build -t speckle/speckle-server:local -f packages/server/Dockerfile .
	cd ../.. && docker build -t speckle/speckle-preview-service:local -f packages/preview-service/Dockerfile .
	cd ../.. && docker build -t speckle/speckle-webhook-service:local -f packages/webhook-service/Dockerfile .
	cd ../.. && docker build -t speckle/speckle-fileimport-service:local -f packages/fileimport-service/Dockerfile .
	cd ../.. && docker build -t speckle/speckle-monitor-deployment:local -f utils/monitor-deployment/Dockerfile .

	echo "Making locally built images available inside minikube cluster. This takes a bit to copy, unfortunately..."

	minikube image load speckle/speckle-frontend:local
	minikube image load speckle/speckle-server:local
	minikube image load speckle/speckle-preview-service:local
	minikube image load speckle/speckle-webhook-service:local
	minikube image load speckle/speckle-fileimport-service:local
	minikube image load speckle/speckle-monitor-deployment:local


install:
	helm uninstall speckle-test 2>/dev/null || true
	helm install -f test-values.yml speckle-test ./speckle-server

	@echo Make sure you add these lines in /etc/hosts:
	@echo \# ---------------------
	@echo `minikube ip`    speckle.minikube
	@echo `minikube ip`    grafana.minikube
	@echo `minikube ip`    prometheus.minikube
	@echo \# ---------------------
	@echo Installed successfully.
	@echo You can access the prometheus server at http://prometheus.minikube/
	@echo You can access grafana at http://grafana.minikube/    \(user: admin, password: prom-operator\)
	@echo You can access the Speckle server at http://speckle.minikube/


# If you have an existing minikube, you can `minikube delete` and `minikube start` to start a fresh cluster
# This "make target" will install all requirements in a fresh cluster
init-local-minikube:
	@(kubectl config current-context | grep -q minikube) || (echo "ERROR: Minikube is not the current kubectl context. Temporarily modify the makefile if you really want to use the current configured kubectl context" && exit 1)

	@echo "Enabling nginx ingress minikube plugin..."
	minikube addons enable ingress

	@echo "Installing kube-prometheus-stack"
	helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
	helm repo update
	helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack

	kubectl apply -f test-init.yml
