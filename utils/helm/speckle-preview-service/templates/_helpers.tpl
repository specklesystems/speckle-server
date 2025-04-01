{{/*
Expand the name of the chart.
*/}}
{{- define "speckle-preview-service.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "speckle-preview-service.fullname" -}}
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
Create the fully qualified domain name of the service
*/}}
{{- define "speckle-preview-service.serviceFQDN" -}}
{{- printf "%s.%s.svc.cluster.local." (include "speckle-preview-service.serviceAccountName" .) .Values.namespace }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "speckle-preview-service.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "speckle-preview-service.labels" -}}
helm.sh/chart: {{ include "speckle-preview-service.chart" . }}
{{ include "speckle-preview-service.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "speckle-preview-service.selectorLabels" -}}
app.kubernetes.io/name: {{ include "speckle-preview-service.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "speckle-preview-service.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "speckle-preview-service.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
