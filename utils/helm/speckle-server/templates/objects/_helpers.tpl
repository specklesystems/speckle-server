{{/*
Expand the name of the chart.
*/}}
{{- define "objects.name" -}}
{{- default "speckle-objects" .Values.objects.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "objects.fullname" -}}
{{- if .Values.objects.fullnameOverride }}
{{- .Values.objects.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "speckle-server" .Values.objects.nameOverride }}
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
{{- define "objects.labels" -}}
{{ include "speckle.commonLabels" . }}
{{ include "objects.selectorLabels" . }}
app.kubernetes.io/component: {{ include "objects.name" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "objects.selectorLabels" -}}
app: {{ include "objects.name" . }}
app.kubernetes.io/name: {{ include "objects.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
{{- end }}

{{/*
Service FQDN
*/}}
{{- define "objects.service.fqdn" -}}
{{ printf "%s.%s.svc.cluster.local." (include "objects.name" $) .Values.namespace }}
{{- end }}

{{/*
Server Port
*/}}
{{- define "objects.port" -}}
{{ printf "%d" 3000 }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "objects.serviceAccountName" -}}
{{- if .Values.objects.serviceAccount.create }}
{{- default (include "objects.fullname" .) .Values.objects.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.objects.serviceAccount.name }}
{{- end }}
{{- end }}
