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
{{ include "speckle.commonLabels" . }}
{{ include "test.selectorLabels" . }}
app.kubernetes.io/component: {{ include "test.name" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "test.selectorLabels" -}}
app: {{ include "test.name" . }}
app.kubernetes.io/name: {{ include "test.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
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
