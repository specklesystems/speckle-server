{{/*
Expand the name of the chart.
*/}}
{{- define "speckle.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "speckle.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "speckle.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
All labels
*/}}
{{- define "speckle.labels" -}}
{{ include "speckle.commonLabels" . }}
{{ include "speckle.selectorLabels" . }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "speckle.commonLabels" -}}
{{ include "speckle.labels.chart" . }}
{{ include "speckle.labels.app-version" . }}
{{ include "speckle.labels.managed-by" . }}
{{ include "speckle.labels.part-of" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "speckle.selectorLabels" -}}
app.kubernetes.io/name: {{ include "speckle.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
{{- end }}

{{/*
Common selector labels
*/}}
{{- define "speckle.commonSelectorLabels" -}}
app.kubernetes.io/instance: {{ .Release.Name }}
project: speckle-server
{{- end }}

{{/*
Chart label
*/}}
{{- define "speckle.labels.chart" -}}
helm.sh/chart: {{ include "speckle.chart" . }}
{{- end }}

{{/*
Managed-by label
*/}}
{{- define "speckle.labels.managed-by" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
App Version label
*/}}
{{- define "speckle.labels.app-version" -}}
{{- if .Chart.AppVersion -}}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end }}

{{/*
Part-of label
*/}}
{{- define "speckle.labels.part-of" -}}
app.kubernetes.io/part-of: {{ include "speckle.name" . }}
{{- end }}

{{/*
Creates a network policy egress definition for connecting to Redis

Expects the global context "$" to be passed as the parameter
*/}}
{{- define "speckle.networkpolicy.egress.redis" -}}
{{- if .Values.redis.networkPolicy.inCluster.enabled -}}
  {{- $port := (default "6379" .Values.redis.networkPolicy.inCluster.port ) -}}
{{ include "speckle.networkpolicy.egress.internal" (dict "podSelector" .Values.redis.networkPolicy.inCluster.kubernetes.podSelector "namespaceSelector" .Values.redis.networkPolicy.inCluster.kubernetes.namespaceSelector "port" $port) }}
{{- else if .Values.redis.networkPolicy.externalToCluster.enabled -}}
  {{- $secret := ( include "speckle.getSecret" (dict "secret_key" "redis_url" "context" . ) ) -}}
  {{- $domain := ( include "speckle.networkPolicy.domainFromUrl" $secret ) -}}
  {{- $port := ( default "6379" ( include "speckle.networkPolicy.portFromUrl" $secret ) ) -}}
{{ include "speckle.networkpolicy.egress.external" (dict "ip" $domain "port" $port) }}
{{- end -}}
{{- end }}

{{/*
Creates a Cilium Network Policy egress definition for connecting to Redis

Expects the global context "$" to be passed as the parameter
*/}}
{{- define "speckle.networkpolicy.egress.redis.cilium" -}}
{{- if .Values.redis.networkPolicy.inCluster.enabled -}}
  {{- $port := (default "6379" .Values.redis.networkPolicy.inCluster.port ) -}}
{{ include "speckle.networkpolicy.egress.internal.cilium" (dict "endpointSelector" .Values.redis.networkPolicy.inCluster.cilium.endpointSelector "serviceSelector" .Values.redis.networkPolicy.inCluster.cilium.serviceSelector "port" $port) }}
{{- else if .Values.redis.networkPolicy.externalToCluster.enabled -}}
  {{- $secret := ( include "speckle.getSecret" (dict "secret_key" "redis_url" "context" . ) ) -}}
  {{- $domain := ( include "speckle.networkPolicy.domainFromUrl" $secret ) -}}
  {{- $port := ( default "6379" ( include "speckle.networkPolicy.portFromUrl" $secret ) ) -}}
{{ include "speckle.networkpolicy.egress.external.cilium" (dict "ip" $domain "port" $port) }}
{{- end -}}
{{- end }}

{{/*
Creates a Kubernetes Network Policy egress definition for connecting to Postgres
*/}}
{{- define "speckle.networkpolicy.egress.postgres" -}}
{{- if .Values.db.networkPolicy.inCluster.enabled -}}
  {{- $port := (default "5432" .Values.db.networkPolicy.inCluster.port ) -}}
{{ include "speckle.networkpolicy.egress.internal" (dict "podSelector" .Values.db.networkPolicy.inCluster.kubernetes.podSelector "namespaceSelector" .Values.db.networkPolicy.inCluster.kubernetes.namespaceSelector "port" $port) }}
{{- else if .Values.db.networkPolicy.externalToCluster.enabled -}}
  {{- $secret := ( include "speckle.getSecret" (dict "secret_key" "postgres_url" "context" . ) ) -}}
  {{- $domain := ( include "speckle.networkPolicy.domainFromUrl" $secret ) -}}
  {{- $port := ( default "5432" ( include "speckle.networkPolicy.portFromUrl" $secret ) ) -}}
{{ include "speckle.networkpolicy.egress.external" (dict "ip" $domain "port" $port) }}
{{- end -}}
{{- end }}

{{/*
Creates a Cilium network policy egress definition for connecting to Postgres
*/}}
{{- define "speckle.networkpolicy.egress.postgres.cilium" -}}
{{- if .Values.db.networkPolicy.inCluster.enabled -}}
  {{- $port := (default "5432" .Values.db.networkPolicy.inCluster.port ) -}}
{{ include "speckle.networkpolicy.egress.internal.cilium" (dict "endpointSelector" .Values.db.networkPolicy.inCluster.cilium.endpointSelector "serviceSelector" .Values.db.networkPolicy.inCluster.cilium.serviceSelector "port" $port) }}
{{- else if .Values.db.networkPolicy.externalToCluster.enabled -}}
  {{- $secret := ( include "speckle.getSecret" (dict "secret_key" "postgres_url" "context" . ) ) -}}
  {{- $domain := ( include "speckle.networkPolicy.domainFromUrl" $secret ) -}}
  {{- $port := ( default "5432" ( include "speckle.networkPolicy.portFromUrl" $secret ) ) -}}
{{ include "speckle.networkpolicy.egress.external.cilium" (dict "ip" $domain "port" $port) }}
{{- end -}}
{{- end }}

{{/*
Creates a Kubernetes network policy egress definition for connecting to S3 compatible storage
*/}}
{{- define "speckle.networkpolicy.egress.blob_storage" -}}
  {{- $port := (default "443" .Values.s3.networkPolicy.port ) -}}
  {{- if .Values.s3.networkPolicy.inCluster.enabled -}}
{{ include "speckle.networkpolicy.egress.internal" (dict "podSelector" .Values.s3.networkPolicy.inCluster.kubernetes.podSelector "namespaceSelector" .Values.s3.networkPolicy.inCluster.kubernetes.namespaceSelector "port" $port) }}
  {{- else if .Values.s3.networkPolicy.externalToCluster.enabled -}}
    {{- $ip := ( include "speckle.networkPolicy.domainFromUrl" .Values.s3.endpoint ) -}}
{{ include "speckle.networkpolicy.egress.external" (dict "ip" $ip "port" $port) }}
  {{- end -}}
{{- end }}

{{/*
Creates a Cilium Network Policy egress definition for connecting to S3 compatible storage
*/}}
{{- define "speckle.networkpolicy.egress.blob_storage.cilium" -}}
  {{- $port := (default "443" .Values.s3.networkPolicy.port ) -}}
  {{- if .Values.s3.networkPolicy.inCluster.enabled -}}
{{ include "speckle.networkpolicy.egress.internal.cilium" (dict "endpointSelector" .Values.s3.networkPolicy.inCluster.cilium.endpointSelector "serviceSelector" .Values.s3.networkPolicy.inCluster.cilium.serviceSelector "port" $port) }}
  {{- else if .Values.s3.networkPolicy.externalToCluster.enabled -}}
    {{- $host := ( include "speckle.networkPolicy.domainFromUrl" .Values.s3.endpoint ) -}}
{{ include "speckle.networkpolicy.egress.external.cilium" (dict "ip" $host "port" $port) }}
  {{- end -}}
{{- end }}

{{/*
Creates a Kubernetes Network Policy egress definition for connecting to the email server

Params:
  - context - Required, global context should be provided
*/}}
{{- define "speckle.networkpolicy.egress.email" -}}
  {{- $port := (default "443" .Values.server.email.port ) -}}
  {{- if .Values.server.email.networkPolicy.inCluster.enabled -}}
{{ include "speckle.networkpolicy.egress.internal" (dict "podSelector" .Values.server.email.networkPolicy.inCluster.kubernetes.podSelector "namespaceSelector" .Values.server.email.networkPolicy.inCluster.kubernetes.namespaceSelector "port" $port) }}
  {{- else if .Values.server.email.networkPolicy.externalToCluster.enabled -}}
{{ include "speckle.networkpolicy.egress.external" (dict "ip" .Values.server.email.host "port" $port) }}
  {{- end -}}
{{- end }}

{{/*
Creates a Cilium Network Policy egress definition for connecting to an email server

Expects the global context "$" to be passed as the parameter
*/}}
{{- define "speckle.networkpolicy.egress.email.cilium" -}}
  {{- $port := (default "443" .Values.server.email.port ) -}}
  {{- if .Values.server.email.networkPolicy.inCluster.enabled -}}
{{ include "speckle.networkpolicy.egress.internal.cilium" (dict "endpointSelector" .Values.server.email.networkPolicy.inCluster.cilium.endpointSelector "serviceSelector" .Values.server.email.networkPolicy.inCluster.cilium.serviceSelector "port" $port) }}
  {{- else if .Values.server.email.networkPolicy.externalToCluster.enabled -}}
{{ include "speckle.networkpolicy.egress.external.cilium" (dict "ip" .Values.server.email.host "port" $port) }}
  {{- end -}}
{{- end }}

{{/*
Creates a DNS match pattern for discovering the postgres IP

Usage:
{{ include "speckle.networkpolicy.dns.postgres.cilium" $ }}

Params:
  - context - Required, global context should be provided.
*/}}
{{- define "speckle.networkpolicy.dns.postgres.cilium" -}}
{{- $secret := ( include "speckle.getSecret" (dict "secret_key" "postgres_url" "context" . ) ) -}}
{{- $domain := ( include "speckle.networkPolicy.domainFromUrl" $secret ) -}}
  {{- if (and .Values.db.networkPolicy.externalToCluster.enabled ( ne ( include "speckle.isIPv4" $domain ) "true" ) ) -}}
{{ include "speckle.networkpolicy.matchNameOrPattern" $domain }}
  {{- end }}
{{- end }}

{{/*
Creates a DNS match pattern for discovering redis store IP

Usage:
{{ include "speckle.networkpolicy.dns.redis.cilium" $ }}

Params:
  - context - Required, global context should be provided.
*/}}
{{- define "speckle.networkpolicy.dns.redis.cilium" -}}
{{- $secret := ( include "speckle.getSecret" (dict "secret_key" "redis_url" "context" . ) ) -}}
{{- $domain := ( include "speckle.networkPolicy.domainFromUrl" $secret ) -}}
  {{- if (and .Values.redis.networkPolicy.externalToCluster.enabled ( ne ( include "speckle.isIPv4" $domain ) "true" ) ) -}}
{{ include "speckle.networkpolicy.matchNameOrPattern" $domain }}
  {{- end }}
{{- end }}

{{/*
Creates a DNS match pattern for discovering blob storage IP
*/}}
{{- define "speckle.networkpolicy.dns.blob_storage.cilium" -}}
{{- $domain := ( include  "speckle.networkPolicy.domainFromUrl" .Values.s3.endpoint ) -}}
  {{- if ne (include "speckle.isIPv4" $domain ) "true" -}}
{{ include "speckle.networkpolicy.matchNameOrPattern" $domain }}
  {{- end }}
{{- end }}

{{/*
Creates a DNS match pattern for discovering email server IP

Usage:
{{ include "speckle.networkpolicy.dns.email.cilium" $ }}

Params:
  - context - Required, global context should be provided.
*/}}
{{- define "speckle.networkpolicy.dns.email.cilium" -}}
{{- $domain := .Values.server.email.host -}}
  {{- if (and .Values.server.email.networkPolicy.externalToCluster.enabled ( ne ( include "speckle.isIPv4" $domain ) "true" ) ) -}}
{{ include "speckle.networkpolicy.matchNameOrPattern" $domain }}
  {{- end }}
{{- end }}

{{/*
Creates a network policy egress definition for connecting to an external url:port or ip:port

Usage:
{{ include "speckle.networkpolicy.egress.external" (dict "ip" "" "port" "6379") }}

Params:
  - ip - String - Optional - IP or Domain of the endpoint to allow egress to. Can provide either ip, fqdn or neither. If neither fqdn or ip is provided then egress is allowed to 0.0.0.0/0 (i.e. everywhere!)
  - port - String - Required

Limitations:
    - IP is limited to IPv4 due to Kubernetes use of IPv4 CIDR
    - Kubernetes network policies do not support FQDN, hence if IP is not known egress is allowed to 0.0.0.0/0

*/}}
{{- define "speckle.networkpolicy.egress.external" -}}
{{- if not .port -}}
    {{- printf "\nNETWORKPOLICY ERROR: The port was not provided \"%s\"\n" .port | fail -}}
{{- end -}}
- to:
    - ipBlock:
    {{- if ( eq ( include "speckle.isIPv4" .ip ) "true" ) }}
        cidr: {{ printf "%s/32" .ip }}
    {{- else }}
        # Kubernetes network policy does not support fqdn, so we have to allow egress anywhere
        cidr: 0.0.0.0/0
        # except to kubernetes pods or services
        except:
          - 10.0.0.0/8
    {{- end }}
  ports:
    - port: {{ printf "%s" .port }}
{{- end }}

{{/*
Creates a Cilium network policy egress definition for connecting to an external Layer 3/Layer 4 endpoint i.e. ip:port

Usage:
{{ include "speckle.networkpolicy.egress.external.cilium" (dict "ip" "" "port" "6379") }}

Params:
  - ip - String - Optional - IP or Domain of the endpoint to allow egress to. Can provide either ip, fqdn or neither. If neither fqdn or ip is provided then egress is allowed to 0.0.0.0/0 (i.e. everywhere!)
  - port - String - Required

Limitations:
    - IP is limited to IPv4 due to Kubernetes use of IPv4 CIDR
*/}}
{{- define "speckle.networkpolicy.egress.external.cilium" -}}
{{- if not .port -}}
    {{- printf "\nNETWORKPOLICY ERROR: The port was not provided \"%s\"\n" .port | fail -}}
{{- end -}}
{{- if ( eq ( include "speckle.isIPv4" .ip ) "true" ) }}
- toCIDR:
    - {{ printf "%s/32" .ip }}
{{- else if .ip }}
- toFQDNs:
{{ include "speckle.networkpolicy.matchNameOrPattern" .ip | indent 4 }}
{{- else }}
- toCIDRSet:
      # Kubernetes network policy does not support fqdn, so we have to allow egress anywhere
    - cidr: 0.0.0.0/0
      # except to kubernetes pods or services
      except:
        - 10.0.0.0/8
{{- end }}
  toPorts:
    - ports:
      - port: {{ printf "%s" .port | quote }}
        protocol: TCP
{{- end }}

{{- define "speckle.networkpolicy.matchNameOrPattern" -}}
{{- if not . -}}
    {{- printf "\nNETWORKPOLICY ERROR: The name or glob pattern was not provided \"%s\"\n" . | fail -}}
{{- end -}}
  {{- if ( contains "*" . ) }}
- matchPattern: {{ printf "%s" . }}
  {{- else }}
- matchName: {{ printf "%s" . }}
  {{- end }}
{{- end }}

{{/*
Creates a network policy egress definition for connecting to a pod within the cluster

Usage:
{{ include "speckle.networkpolicy.egress.internal" (dict "podSelector" {matchLabels.name=redis} "namespaceSelector" {matchLabels.name=redis} "port" "6379") }}

Params:
  - podSelector - Object - Required
  - namespaceSelector - Object - Required
  - port - String - Required

*/}}
{{- define "speckle.networkpolicy.egress.internal" -}}
{{- if not .podSelector -}}
    {{- printf "\nNETWORKPOLICY ERROR: The pod selector was not provided\n" | fail -}}
{{- end -}}
{{- if not .namespaceSelector -}}
    {{- printf "\nNETWORKPOLICY ERROR: The namespace selector was not provided\n" | fail -}}
{{- end -}}
{{- if not .port -}}
    {{- printf "\nNETWORKPOLICY ERROR: The port was not provided \"%s\"\n" .port | fail -}}
{{- end -}}
- to:
    - namespaceSelector:
{{ .namespaceSelector | toYaml | indent 8 }}
      podSelector:
{{ .podSelector | toYaml | indent 8 }}
  ports:
    - port: {{ printf "%s" .port }}
{{- end }}

{{/*
Creates a cilium network policy egress definition for connecting to an endpoint (pod or kubernetes endpoint) or service within the cluster

Usage:
{{ include "speckle.networkpolicy.egress.internal.cilium" (dict "endpointSelector" {matchLabels.name=redis matchLabels."io.kubernetes.pod.namespace.labels.name"=speckle} "serviceSelector" "" "port" "6379") }}

Params:
  - endpointSelector - Object - One of endpointSelector or serviceSelector is required.
  - serviceSelector - Object - One of endpointSelector or serviceSelector is required.
  - port - String - Required

*/}}
{{- define "speckle.networkpolicy.egress.internal.cilium" -}}
{{- if not .endpointSelector -}}
    {{- printf "\nNETWORKPOLICY ERROR: The Endpoint selector was not provided\n" | fail -}}
{{- end -}}
{{- if not .port -}}
    {{- printf "\nNETWORKPOLICY ERROR: The port was not provided \"%s\"\n" .port | fail -}}
{{- end -}}
{{- if .endpointSelector }}
- toEndpoints:
{{ .endpointSelector | toYaml | indent 4 }}
  toPorts:
    - ports:
      - port: {{ printf "%s" .port | quote }}
        protocol: TCP
{{- end }}
{{- if .serviceSelector }}
- toServices:
{{ .serviceSelector | toYaml | indent 4 }}
  toPorts:
    - ports:
      - port: {{ printf "%s" .port | quote }}
        protocol: TCP
{{- end }}
{{- end }}

{{/*
Tries to determine if a given string is a valid IP address
Usage:
{{ include "speckle.isIPv4" "123.45.67.89" }}

Params:
  - ip - String - Required - The string which we will try to determine is a valid IP address
*/}}
{{- define "speckle.isIPv4" -}}
{{- if regexMatch "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$" . -}}
{{- printf "true" -}}
{{- else -}}
{{- printf "false" -}}
{{- end -}}
{{- end -}}

{{/*
Extracts the domain name from a url
*/}}
{{- define "speckle.networkPolicy.domainFromUrl" -}}
  {{- if not . -}}
      {{- printf "\nERROR: The url was not provided as the context \"%s\"\n" . | fail -}}
  {{- end -}}
  {{- $host := ( urlParse . ).host -}}
  {{- if (contains ":" $host) -}}
    {{- $host = first (mustRegexSplit ":" $host -1) -}}
  {{- end -}}
{{ printf "%s" $host }}
{{- end }}

{{/*
Extracts the port from a url
*/}}
{{- define "speckle.networkPolicy.portFromUrl" -}}
  {{- if not . -}}
      {{- printf "\nERROR: The url was not provided as the context \"%s\"\n" . | fail -}}
  {{- end -}}
  {{- $host := ( urlParse . ).host -}}
  {{- if (contains ":" $host) -}}
{{ printf "%s" ( index (mustRegexSplit ":" $host -1) 1 ) }}
  {{- end -}}
{{- end }}
{{/*
Renders a value that contains template.
Usage:
{{ include "speckle.renderTpl" ( dict "value" .Values.path.to.value "context" $) }}
*/}}
{{- define "speckle.renderTpl" -}}
    {{- if typeIs "string" .value }}
        {{- tpl .value .context }}
    {{- else }}
        {{- tpl (.value | toYaml) .context }}
    {{- end }}
{{- end -}}

{{/*
Selector labels for Prometheus
*/}}
{{- define "speckle.prometheus.selectorLabels" -}}
{{ include "speckle.prometheus.selectorLabels.release" . }}
io.kubernetes.pod.namespace: {{ default .Values.namespace .Values.prometheusMonitoring.namespace }}
{{- end }}

{{/*
Selector labels for Prometheus release
*/}}
{{- define "speckle.prometheus.selectorLabels.release" -}}
prometheus: {{ default "kube-prometheus-stack" .Values.prometheusMonitoring.release }}-prometheus
{{- end }}

{{/*
Ingress pod selector
*/}}
{{- define "speckle.ingress.selector.pod" -}}
app.kubernetes.io/name: {{ .Values.ingress.controllerName }}
{{- end }}

{{/*
Retrieves an existing secret

Usage:
{{ include "speckle.getSecret" (dict "secret_key" "postgres_url" "context" $ )}}

Params:
  - secret_key - Required, the key within the secret.
  - context - Required, must be global context.  Values of global context must include 'namespace' and 'secretName' keys.
*/}}
{{- define "speckle.getSecret" -}}
{{- $secretResource := (lookup "v1" "Secret" .context.Values.namespace .context.Values.secretName ) -}}
{{- $secret := ( index $secretResource.data .secret_key ) -}}
{{- $secretDecoded := (b64dec $secret) -}}
{{- printf "%s" $secretDecoded }}
{{- end }}
