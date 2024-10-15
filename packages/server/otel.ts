import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex'
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino'
import { AlwaysOnSampler, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import * as opentelemetry from '@opentelemetry/sdk-node'

const OTEL_NAME = 'speckle'

export function initOpenTelemetry() {
  const sdk = new opentelemetry.NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: OTEL_NAME
    }),
    sampler: new AlwaysOnSampler(),
    traceExporter: new OTLPTraceExporter({
      // optional - default url is http://localhost:4318/v1/traces
      url: '<your-otlp-endpoint>/v1/traces',
      // optional - collection of custom headers to be sent with each request, empty by default
      headers: {}
    }),
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
      new PinoInstrumentation()
    ],
    spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter({}))
  })
  sdk.start()
}
