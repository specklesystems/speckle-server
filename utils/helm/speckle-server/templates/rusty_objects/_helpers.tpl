{{/*
Expand the name of the chart.
*/}}
{{- define "rusty_objects.name" -}}
{{- default "rusty-objects" .Values.rusty_objects.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "rusty_objects.fullname" -}}
{{- if .Values.rusty_objects.fullnameOverride }}
{{- .Values.rusty_objects.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "speckle-rusty-objects" .Values.rusty_objects.nameOverride }}
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
{{- define "rusty_objects.labels" -}}
{{ include "speckle.commonLabels" . }}
{{ include "rusty_objects.selectorLabels" . }}
app.kubernetes.io/component: {{ include "rusty_objects.name" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "rusty_objects.selectorLabels" -}}
app: {{ include "rusty_objects.name" . }}
app.kubernetes.io/name: {{ include "rusty_objects.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
{{- end }}

{{/*
Service FQDN
*/}}
{{- define "rusty_objects.service.fqdn" -}}
{{ printf "%s.%s.svc.cluster.local." (include "rusty_objects.name" $) .Values.namespace }}
{{- end }}

{{/*
Server Port
*/}}
{{- define "rusty_objects.port" -}}
{{ printf "%d" 8000 }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "rusty_objects.serviceAccountName" -}}
{{- if .Values.rusty_objects.serviceAccount.create }}
{{- default (include "rusty_objects.fullname" .) .Values.rusty_objects.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.rusty_objects.serviceAccount.name }}
{{- end }}
{{- end }}
