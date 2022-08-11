{{/*
Expand the name of the chart.
*/}}
{{- define "test.name" -}}
{{- default "speckle-test-deployment" .Values.test.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "test.fullname" -}}
{{- if .Values.test.fullnameOverride }}
{{- .Values.test.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "speckle-test-deployment" .Values.test.nameOverride }}
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
{{- define "test.labels" -}}
helm.sh/chart: {{ include "speckle.chart" . }}
{{ include "test.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/component: {{ include "test.name" . }}
app.kubernetes.io/part-of: {{ include "speckle.name" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "test.selectorLabels" -}}
app.kubernetes.io/name: {{ include "test.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "test.serviceAccountName" -}}
{{- if .Values.test.serviceAccount.create }}
{{- default (include "test.fullname" .) .Values.test.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.test.serviceAccount.name }}
{{- end }}
{{- end }}
