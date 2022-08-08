{{/*
Expand the name of the chart.
*/}}
{{- define "webhook_service.name" -}}
{{- default "speckle-webhook-service" .Values.webhook_service.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "webhook_service.fullname" -}}
{{- if .Values.webhook_service.fullnameOverride }}
{{- .Values.webhook_service.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "speckle-webhook-service" .Values.webhook_service.nameOverride }}
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
{{- define "webhook_service.labels" -}}
{{ include "speckle.commonLabels" . }}
app.kubernetes.io/component: {{ include "webhook_service.name" . }}
{{ include "webhook_service.selectorLabels" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "webhook_service.selectorLabels" -}}
app: {{ include "webhook_service.name" . }}
app.kubernetes.io/name: {{ include "webhook_service.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "webhook_service.serviceAccountName" -}}
{{- if .Values.webhook_service.serviceAccount.create }}
{{- default (include "webhook_service.fullname" .) .Values.webhook_service.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.webhook_service.serviceAccount.name }}
{{- end }}
{{- end }}
