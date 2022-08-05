{{/*
Expand the name of the chart.
*/}}
{{- define "preview_service.name" -}}
{{- default "speckle-preview-service" .Values.preview_service.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "preview_service.fullname" -}}
{{- if .Values.preview_service.fullnameOverride }}
{{- .Values.preview_service.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "speckle-preview-service" .Values.preview_service.nameOverride }}
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
{{- define "preview_service.labels" -}}
{{ include "speckle.commonLabels" . }}
{{ include "preview_service.selectorLabels" . }}
app.kubernetes.io/component: {{ include "preview_service.name" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "preview_service.selectorLabels" -}}
app: {{ include "preview_service.name" . }}
app.kubernetes.io/name: {{ include "preview_service.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "preview_service.serviceAccountName" -}}
{{- if .Values.preview_service.serviceAccount.create }}
{{- default (include "preview_service.fullname" .) .Values.preview_service.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.preview_service.serviceAccount.name }}
{{- end }}
{{- end }}
