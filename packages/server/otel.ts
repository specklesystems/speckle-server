import { AlwaysOnSampler, NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex'
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'

import opentelemetry from '@opentelemetry/api'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'

const OTEL_NAME = 'speckle'

export function initOpenTelemetry() {
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
      })
    ]
  })
  provider.addSpanProcessor(new SimpleSpanProcessor(new OTLPTraceExporter({})))
  provider.register()
  opentelemetry.trace.getTracer(OTEL_NAME)
}
