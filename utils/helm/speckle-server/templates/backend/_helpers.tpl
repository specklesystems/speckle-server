{{/*
Expand the name of the chart.
*/}}
{{- define "backend.name" -}}
{{- default "speckle-backend" .Values.server.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "backend.fullname" -}}
{{- if .Values.server.fullnameOverride }}
{{- .Values.server.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "speckle-backend" .Values.server.nameOverride }}
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
{{- define "backend.labels" -}}
{{ include "speckle.commonLabels" . }}
{{ include "backend.selectorLabels" . }}
app.kubernetes.io/component: {{ include "backend.name" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "backend.selectorLabels" -}}
app: {{ include "backend.name" . }}
app.kubernetes.io/name: {{ include "backend.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "backend.serviceAccountName" -}}
{{- if .Values.server.serviceAccount.create }}
{{- default (include "backend.fullname" .) .Values.server.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.server.serviceAccount.name }}
{{- end }}
{{- end }}
