{{/*
Expand the name of the chart.
*/}}
{{- define "monitoring.name" -}}
{{- default "speckle-monitoring" .Values.monitoring.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "monitoring.fullname" -}}
{{- if .Values.monitoring.fullnameOverride }}
{{- .Values.monitoring.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "speckle-monitoring" .Values.monitoring.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "monitoring.labels" -}}
helm.sh/chart: {{ include "speckle.chart" . }}
{{ include "monitoring.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/component: {{ include "monitoring.name" . }}
app.kubernetes.io/part-of: {{ include "speckle.name" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "monitoring.selectorLabels" -}}
app.kubernetes.io/name: {{ include "monitoring.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "monitoring.serviceAccountName" -}}
{{- if .Values.monitoring.serviceAccount.create }}
{{- default (include "monitoring.fullname" .) .Values.monitoring.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.monitoring.serviceAccount.name }}
{{- end }}
{{- end }}
