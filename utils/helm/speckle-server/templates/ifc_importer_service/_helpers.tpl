{{/*
Expand the name of the chart.
*/}}
{{- define "ifc_importer_service.name" -}}
{{- default "speckle-ifc-importer-service" .Values.ifc_importer.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "ifc_importer_service.fullname" -}}
{{- if .Values.ifc_importer_service.fullnameOverride }}
{{- .Values.ifc_importer_service.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "speckle-ifc-importer-service" .Values.ifc_importer_service.nameOverride }}
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
{{- define "ifc_importer_service.labels" -}}
{{ include "speckle.commonLabels" . }}
app.kubernetes.io/component: {{ include "ifc_importer_service.name" . }}
{{ include "ifc_importer_service.selectorLabels" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "ifc_importer_service.selectorLabels" -}}
app: {{ include "ifc_importer_service.name" . }}
app.kubernetes.io/name: {{ include "ifc_importer_service.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "ifc_importer_service.serviceAccountName" -}}
{{- if .Values.ifc_importer_service.serviceAccount.create }}
{{- default (include "ifc_importer_service.fullname" .) .Values.ifc_importer_service.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.ifc_importer_service.serviceAccount.name }}
{{- end }}
{{- end }}
