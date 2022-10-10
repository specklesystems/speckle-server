{{/*
Expand the name of the chart.
*/}}
{{- define "fileimport_service.name" -}}
{{- default "speckle-fileimport-service" .Values.fileimport_service.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "fileimport_service.fullname" -}}
{{- if .Values.fileimport_service.fullnameOverride }}
{{- .Values.fileimport_service.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "speckle-fileimport-service" .Values.fileimport_service.nameOverride }}
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
{{- define "fileimport_service.labels" -}}
{{ include "speckle.commonLabels" . }}
app.kubernetes.io/component: {{ include "fileimport_service.name" . }}
{{ include "fileimport_service.selectorLabels" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "fileimport_service.selectorLabels" -}}
app: {{ include "fileimport_service.name" . }}
app.kubernetes.io/name: {{ include "fileimport_service.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "fileimport_service.serviceAccountName" -}}
{{- if .Values.fileimport_service.serviceAccount.create }}
{{- default (include "fileimport_service.fullname" .) .Values.fileimport_service.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.fileimport_service.serviceAccount.name }}
{{- end }}
{{- end }}
