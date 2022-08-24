{{/*
Expand the name of the chart.
*/}}
{{- define "server.name" -}}
{{- default "speckle-server" .Values.server.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "server.fullname" -}}
{{- if .Values.server.fullnameOverride }}
{{- .Values.server.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "speckle-server" .Values.server.nameOverride }}
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
{{- define "server.labels" -}}
{{ include "speckle.commonLabels" . }}
{{ include "server.selectorLabels" . }}
app.kubernetes.io/component: {{ include "server.name" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "server.selectorLabels" -}}
app: {{ include "server.name" . }}
app.kubernetes.io/name: {{ include "server.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
{{- end }}

{{/*
Service FQDN
*/}}
{{- define "server.service.fqdn" -}}
{{ printf "%s.%s.svc.cluster.local." (include "server.name" $) .Values.namespace }}
{{- end }}

{{/*
Server Port
*/}}
{{- define "server.port" -}}
{{ printf "%d" 3000 }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "server.serviceAccountName" -}}
{{- if .Values.server.serviceAccount.create }}
{{- default (include "server.fullname" .) .Values.server.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.server.serviceAccount.name }}
{{- end }}
{{- end }}
