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
Connects to kube api-server to determine if Cilium CRD are present.
If they are we assume that Cilium is installed.
*/}}
{{- define "speckle.networkpolicy.ciliumIsPresent" -}}

{{- end }}

{{/*
Creates a network policy egress definition for connecting to Redis

Expects the global context "$" to be passed as the parameter
*/}}
{{- define "speckle.networkpolicy.egress.redis" -}}
{{- $port := (default "6379" .Values.redis.networkPolicy.port ) -}}
{{- if .Values.redis.networkPolicy.inCluster.enabled -}}
{{ include "speckle.networkpolicy.egress.internal" (dict "podSelector" .Values.redis.networkPolicy.inCluster.podSelector "namespaceSelector" .Values.redis.networkPolicy.inCluster.namespaceSelector "port" $port) }}
{{- else if .Values.redis.networkPolicy.externalToCluster.enabled -}}
{{ include "speckle.networkpolicy.egress.external" (dict "ip" .Values.redis.networkPolicy.externalToCluster.ipv4 "port" $port) }}
{{- end -}}
{{- end }}

{{/*
Creates a network policy egress definition for connecting to Postgres
*/}}
{{- define "speckle.networkpolicy.egress.postgres" -}}
{{- $port := (default "5432" .Values.db.networkPolicy.port ) -}}
{{- if .Values.db.networkPolicy.inCluster.enabled -}}
{{ include "speckle.networkpolicy.egress.internal" (dict "podSelector" .Values.db.networkPolicy.inCluster.podSelector "namespaceSelector" .Values.db.networkPolicy.inCluster.namespaceSelector "port" $port) }}
{{- else if .Values.db.networkPolicy.externalToCluster.enabled -}}
{{ include "speckle.networkpolicy.egress.external" (dict "ip" .Values.db.networkPolicy.externalToCluster.ipv4 "port" $port) }}
{{- end -}}
{{- end }}

{{/*
Creates a network policy egress definition for connecting to Postgres
*/}}
{{- define "speckle.networkpolicy.egress.blob_storage" -}}
{{- $port := (default "443" .Values.s3.networkPolicy.port ) -}}
{{- if .Values.s3.networkPolicy.inCluster.enabled -}}
{{ include "speckle.networkpolicy.egress.internal" (dict "podSelector" .Values.s3.networkPolicy.inCluster.podSelector "namespaceSelector" .Values.s3.networkPolicy.inCluster.namespaceSelector "port" $port) }}
{{- else if .Values.s3.networkPolicy.externalToCluster.enabled -}}
  {{- $host := (urlParse .Values.s3.endpoint).host -}}
  {{- $ip := "" -}}
  {{- if eq (include "speckle.isIPv4" $host) "true" -}}
    {{- $ip = $host -}}
  {{- end -}}
{{ include "speckle.networkpolicy.egress.external" (dict "ip" $ip "port" $port) }}
{{- end -}}
{{- end }}

{{/*
Creates a network policy egress definition for connecting to an external url:port or ip:port

Usage:
{{ include "speckle.networkpolicy.egress.external" (dict "ip" "" "port" "6379") }}

Params:
  - ip - String - Optional - If the IP is not known, then egress is allowed to 0.0.0.0/0.
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
    {{- if .ip }}
        cidr: {{ printf "%s/32" .ip }}
    {{- else }}
        # Kubernetes network policy does not support fqdn, so we have to allow egress anywhere
        cidr: 0.0.0.0/0
        # except to kubernetes pods or services
        # except:
        #   - 10.0.0.0/8
    {{- end }}
  ports:
    - port: {{ printf "%s" .port }}
{{- end }}

{{/*
Creates a network policy egress definition for connecting to a pod within the cluster

Usage:
{{ include "speckle.networkpolicy.egress.internal" (dict "podSelectorLabels" {matchLabels.name=redis} "namespaceSelector" {matchLabels.name=redis} "port" "6379") }}

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
Tries to determine if a given string is a valid IP address
Usage:
{{ include "speckle.isIPv4" "123.45.67.89" }}

Params:
  - ip - String - Required - The string which we will try to determine is a valid IP address
{{- if regexMatch "^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$" . -}}
  "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
*/}}
{{- define "speckle.isIPv4" -}}
{{- if regexMatch "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$" . -}}
{{- printf "true" -}}
{{- else -}}
{{- printf "false" -}}
{{- end -}}
{{- end -}}
