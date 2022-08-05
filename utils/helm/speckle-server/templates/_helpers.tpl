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
