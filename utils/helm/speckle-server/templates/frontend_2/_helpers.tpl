{{/*
Expand the name of the chart.
*/}}
{{- define "frontend_2.name" -}}
{{- default "speckle-frontend-2" .Values.frontend_2.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "frontend_2.fullname" -}}
{{- if .Values.frontend_2.fullnameOverride }}
{{- .Values.frontend_2.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "speckle-frontend-2" .Values.frontend_2.nameOverride }}
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
{{- define "frontend_2.labels" -}}
{{ include "speckle.commonLabels" . }}
app.kubernetes.io/component: {{ include "frontend_2.name" . }}
{{ include "frontend_2.selectorLabels" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "frontend_2.selectorLabels" -}}
app: {{ include "frontend_2.name" . }}
app.kubernetes.io/name: {{ include "frontend_2.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "frontend_2.serviceAccountName" -}}
{{- if .Values.frontend_2.serviceAccount.create }}
{{- default (include "frontend_2.fullname" .) .Values.frontend_2.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.frontend_2.serviceAccount.name }}
{{- end }}
{{- end }}
