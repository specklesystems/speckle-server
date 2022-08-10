{{/*
Expand the name of the chart.
*/}}
{{- define "speckle.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "speckle.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "speckle.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
All labels
*/}}
{{- define "speckle.labels" -}}
{{ include "speckle.commonLabels" . }}
{{ include "speckle.selectorLabels" . }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "speckle.commonLabels" -}}
{{ include "speckle.labels.chart" . }}
{{ include "speckle.labels.app-version" . }}
{{ include "speckle.labels.managed-by" . }}
{{ include "speckle.labels.part-of" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "speckle.selectorLabels" -}}
app.kubernetes.io/name: {{ include "speckle.name" . }}
{{ include "speckle.commonSelectorLabels" . }}
{{- end }}

{{/*
Common selector labels
*/}}
{{- define "speckle.commonSelectorLabels" -}}
app.kubernetes.io/instance: {{ .Release.Name }}
project: speckle-server
{{- end }}

{{/*
Chart label
*/}}
{{- define "speckle.labels.chart" -}}
helm.sh/chart: {{ include "speckle.chart" . }}
{{- end }}

{{/*
Managed-by label
*/}}
{{- define "speckle.labels.managed-by" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
App Version label
*/}}
{{- define "speckle.labels.app-version" -}}
{{- if .Chart.AppVersion -}}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end }}

{{/*
Part-of label
*/}}
{{- define "speckle.labels.part-of" -}}
app.kubernetes.io/part-of: {{ include "speckle.name" . }}
{{- end }}

{{/*
Connects to kube api-server to determine if Cilium CRD are present.
If they are we assume that Cilium is installed.
*/}}
{{- define "speckle.networkpolicy.ciliumIsPresent" -}}

{{- end }}

{{/*
Creates a network policy egress definition for connecting to Redis
*/}}
{{- define "speckle.networkpolicy.egress.redis" -}}
{{ include "speckle.networkpolicy.egressfromsecret" (dict "secret_key" "redis_url" "default_port" "6379" "context" .) }}
{{- end }}

{{/*
Creates a network policy egress definition for connecting to Postgres
*/}}
{{- define "speckle.networkpolicy.egress.postgres" -}}
{{ include "speckle.networkpolicy.egressfromsecret" (dict "secret_key" "postgres_url" "default_port" "5432" "context" .) }}
{{- end }}

{{/*
Creates a network policy egress definition for connecting to Postgres
*/}}
{{- define "speckle.networkpolicy.egress.blob_storage" -}}
{{ include "speckle.networkpolicy.egress" (dict "url" .Values.s3.endpoint "default_port" "443" "context" .) }}
{{- end }}

{{/*
Creates a network policy egress definition for connecting to a url(:port)
The url is stored in a secret at .Values.secretName

Usage:
{{ include "speckle.networkpolicy.egressfromsecret" (dict "secret_key" "redis_url" "default_port" "6379" "context" $) }}

Params:
  - secret_key - String - Required - Name of the key within the secret (.Values.secretName) where the url is stored.
  - default_port - String - Required - If the port is not defined in the url, the default port to use (e.g. 443 for https).
  - context - Dictionary - Required - Please ensure the global context "$" is passed from the calling yaml file
*/}}
{{- define "speckle.networkpolicy.egressfromsecret" -}}
{{- $urlFromSecret := (include "speckle.secrets.existing.get" (dict "secret" .context.Values.secretName "key" .secret_key "context" .context) | b64dec ) -}}
{{ include "speckle.networkpolicy.egress" (dict "url" $urlFromSecret "default_port" .default_port "context" .context ) }}
{{- end -}}

{{/*
Creates a network policy egress definition for connecting to a url(:port)

Usage:
{{ include "speckle.networkpolicy.egressfromsecret" (dict "url" "https://user:name@myurl.com:123/?query=params" "default_port" "6379" "context" $) }}

Params:
  - url - String - Required - Url. Protocol and host are required. Port is optional. User details, path, and query parameters are optional and ignored.
  - default_port - String - Required - If the port is not defined in the url, the default port to use (e.g. 443 for https).
  - context - Dictionary - Required - Please ensure the global context "$" is passed from the calling yaml file

Limitations:
    - does not yet handle IPv6
    - If a domain name is provided, then egress to any non-k8s (10.*) IP addresses are allowed (though port is restricted)

*/}}
{{- define "speckle.networkpolicy.egress" -}}
{{- $parsedPort := default "443" .default_port -}}
{{- $urlHost := (urlParse .url).host -}}
{{- if not $urlHost -}}
    {{- printf "\nNETWORKPOLICY ERROR: The url \"%s\" was not in the expected format and does not contain a valid host.\n" $urlHost | fail -}}
{{- end -}}
{{- $hostDomain := $urlHost -}}
{{- if contains ":" $urlHost -}}
    {{- $parsedUrl := mustRegexSplit ":" $urlHost -1 -}}
    {{- $parsedUrlLen := len $parsedUrl -}}
    {{- if or (lt $parsedUrlLen 1) (gt $parsedUrlLen 2) -}}
        {{- printf "\nNETWORKPOLICY ERROR: The url \"%s\" was not in the expected format\n" $parsedUrl | fail -}}
    {{- end -}}
    {{- $hostDomain = mustFirst $parsedUrl -}}
    {{- if eq $parsedUrlLen 2 -}}
        {{- $parsedPort = mustLast $parsedUrl -}}
    {{- end -}}
{{- end -}}
- to:
    - ipBlock:
    {{- if eq (include "speckle.isIPv4" $hostDomain) "true" }}
        cidr: {{ printf "%s/32" $hostDomain }}
    {{- else }}
        # Kubernetes network policy does not support fqdn, so we have to allow egress anywhere
        cidr: 0.0.0.0/0
        # except to kubernetes pods or services
        except:
          - 10.0.0.0/8
    {{- end }}
  ports:
    - port: {{ printf "%s" $parsedPort }}
{{- end }}

{{/*
Uses kubernetes api-server to get the value of an existing secret in the cluster.
Expects the secret to be in the same namespace as the Helm Release.

Usage:
{{ include "speckle.secrets.existing.get" (dict "secret" "secret-name" "key" "keyName" "context" $) }}

Params:
  - secret - String - Required - Name of the 'Secret' resource where the password is stored.
  - key - String - Required - Name of the key in the secret.

*/}}
{{- define "speckle.secrets.existing.get" -}}
{{- $password := "" -}}
{{- $secretData := (lookup "v1" "Secret" $.context.Release.Namespace .secret).data -}}
{{- if $secretData -}}
  {{- if hasKey $secretData .key -}}
    {{- $password = index $secretData .key -}}
  {{- else -}}
    {{- printf "\nSECRETS ERROR: The secret \"%s\" does not contain the key \"%s\"\n" .secret .key | fail -}}
  {{- end -}}
{{- else -}}
    {{- printf "\nSECRETS ERROR: The secret \"%s\" cannot be found in namespace \"%s\"\n" .secret $.context.Release.Namespace | fail -}}
{{- end -}}
{{- printf "%s" $password }}
{{- end -}}

{{/*
Tries to determine if a given string is a valid IP address

Usage:
{{ include "speckle.isIP" "123.45.67.89" }}

Params:
  - host - String - Required - The string which we will try to determine is a valid IP address
{{- if regexMatch "^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$" . -}}
  "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
*/}}
{{- define "speckle.isIPv4" -}}
{{- if regexMatch "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$" . -}}
{{- printf "true" -}}
{{- else -}}
{{- printf "false" -}}
{{- end -}}
{{- end -}}
