{{ if (and .Values.gatewayAPI.enabled .Values.ingress.enabled) }}
{{- fail "Error: gatewayAPI and ingress cannot both be enabled. Please choose one or the other." }}
{{- end }}
