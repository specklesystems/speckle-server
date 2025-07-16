{{/*
Expand the name of the chart.
*/}}
{{- define "ifc_import_service.name" -}}
{{- default "speckle-ifc-import-service" .Values.ifc_import_service.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "ifc_import_service.fullname" -}}
{{- if .Values.ifc_import_service.fullnameOverride }}
{{- .Values.ifc_import_service.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "speckle-ifc-import-service" .Values.ifc_import_service.nameOverride }}
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
{{- define "ifc_import_service.labels" -}}
{{ include "speckle.commonLabels" . }}
app.kubernetes.io/component: {{ include "ifc_import_service.name" . }}
{{ include "ifc_import_service.selectorLabels" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "ifc_import_service.selectorLabels" -}}
app: {{ include "ifc_import_service.name" . }}
app.kubernetes.io/name: {{ include "ifc_import_service.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "ifc_import_service.serviceAccountName" -}}
{{- if .Values.ifc_import_service.serviceAccount.create }}
{{- default (include "ifc_import_service.fullname" .) .Values.ifc_import_service.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.ifc_import_service.serviceAccount.name }}
{{- end }}
{{- end }}
