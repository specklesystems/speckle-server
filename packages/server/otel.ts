import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex'
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino'
import { AlwaysOnSampler, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import opentelemetry from '@opentelemetry/api'
import {
  getOtelHeaderValue,
  getOtelTraceKey,
  getOtelTracingUrl
} from '@/modules/shared/helpers/envHelper'

const OTEL_NAME = 'speckle'

export function initOpenTelemetry() {
  let otelTracingUrl: string | null = null
  try {
    otelTracingUrl = getOtelTracingUrl()
    if (!otelTracingUrl) return // no tracing url, no tracing
  } catch {
    return // no tracing url, no tracing
  }

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: OTEL_NAME
    }),
    sampler: new AlwaysOnSampler()
  })
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      // Express instrumentation expects HTTP layer to be instrumented
      new HttpInstrumentation(),
      new GraphQLInstrumentation({
        // optional params
        // allowValues: true,
        // depth: 2,
        // mergeItems: true,
        // ignoreTrivialResolveSpans: true,
        // ignoreResolveSpans: true,
      }),
      new ExpressInstrumentation(),
      new KnexInstrumentation({
        maxQueryLength: 100
      }),
      new PinoInstrumentation({
        disableLogSending: true
      })
    ]
  })

  const headers: Partial<Record<string, unknown>> = {}
  const key = getOtelTraceKey()
  const value = getOtelHeaderValue()
  if (key && value) {
    headers[key] = value
  }

  const exporter = new OTLPTraceExporter({
    url: otelTracingUrl,
    headers
  })

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter))

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register()

  opentelemetry.trace.getTracer(OTEL_NAME)
}
