{{/*
Expand the name of the chart.
*/}}
{{- define "frontend.name" -}}
{{- default "speckle-frontend" .Values.frontend.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "frontend.fullname" -}}
{{- if .Values.frontend.fullnameOverride }}
{{- .Values.frontend.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "speckle-frontend" .Values.frontend.nameOverride }}
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
{{- define "frontend.labels" -}}
{{ include "speckle.commonLabels" . }}
app.kubernetes.io/component: {{ include "frontend.name" . }}
{{ include "frontend.selectorLabels" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "frontend.selectorLabels" -}}
app: {{ include "frontend.name" . }}
app.kubernetes.io/name: {{ include "frontend.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "frontend.serviceAccountName" -}}
{{- if .Values.frontend.serviceAccount.create }}
{{- default (include "frontend.fullname" .) .Values.frontend.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.frontend.serviceAccount.name }}
{{- end }}
{{- end }}
