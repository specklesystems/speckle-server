// import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
// import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

// const collectorOptions = {
//   url: '<opentelemetry-collector-url>', // url is optional and can be omitted - default is http://localhost:55681/v1/traces
//   headers: {}, // an optional object containing custom headers to be sent with each request
//   concurrencyLimit: 10 // an optional limit on pending requests
// }

// const provider = new WebTracerProvider()
// const exporter = new OTLPTraceExporter(collectorOptions)
// provider.addSpanProcessor(
//   new BatchSpanProcessor(exporter, {
//     // The maximum queue size. After the size is reached spans are dropped.
//     maxQueueSize: 100,
//     // The maximum batch size of every export. It must be smaller or equal to maxQueueSize.
//     maxExportBatchSize: 10,
//     // The interval between two consecutive exports
//     scheduledDelayMillis: 500,
//     // How long the export can run before it is cancelled
//     exportTimeoutMillis: 30000
//   })
// )

// provider.register()

// import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
// import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web'
// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
// import { SimpleSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base'
// import { registerInstrumentations } from '@opentelemetry/instrumentation'
// import { ZoneContextManager } from '@opentelemetry/context-zone'
// import { B3Propagator } from '@opentelemetry/propagator-b3'

// const collectorOptions = {
//   url: 'http://localhost:4317/v1/traces', // url is optional and can be omitted - default is http://localhost:55681/v1/traces
//   headers: {}, // an optional object containing custom headers to be sent with each request
//   concurrencyLimit: 10 // an optional limit on pending requests
// }

// const provider = new WebTracerProvider()
// const exporter = new OTLPTraceExporter(collectorOptions)

// provider.addSpanProcessor(new SimpleSpanProcessor(exporter))
// // provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()))
// provider.register({
//   contextManager: new ZoneContextManager(),
//   propagator: new B3Propagator()
// })

// registerInstrumentations({
//   instrumentations: [
//     getWebAutoInstrumentations({
//       // load custom configuration for xml-http-request instrumentation
//       '@opentelemetry/instrumentation-xml-http-request': {
//         clearTimingResources: true
//       }
//     })
//   ]
// })

import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
  ConsoleSpanExporter
} from '@opentelemetry/sdk-trace-base'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { B3Propagator } from '@opentelemetry/propagator-b3'
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web'
import { Resource } from '@opentelemetry/resources'
import {
  SemanticAttributes,
  SemanticResourceAttributes,
  ResourceAttributesSC
} from '@opentelemetry/semantic-conventions'

export function configureTracer() {
  const collectorOptions = {
    // url: 'http://localhost:49185/v1/traces', // url is optional and can be omitted - default is http://localhost:55681/v1/traces
    headers: {}, // an optional object containing custom headers to be sent with each request
    concurrencyLimit: 10 // an optional limit on pending requests
  }
  const provider = new WebTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'speckle-frontend'
    })
  })
  const exporter = new OTLPTraceExporter(collectorOptions)
  provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()))
  provider.addSpanProcessor(
    new BatchSpanProcessor(exporter, {
      // The maximum queue size. After the size is reached spans are dropped.
      maxQueueSize: 100,
      // The maximum batch size of every export. It must be smaller or equal to maxQueueSize.
      maxExportBatchSize: 10,
      // The interval between two consecutive exports
      scheduledDelayMillis: 500,
      // How long the export can run before it is cancelled
      exportTimeoutMillis: 30000
    })
  )

  provider.register({
    contextManager: new ZoneContextManager(),
    propagator: new B3Propagator()
  })
  registerInstrumentations({
    instrumentations: [
      getWebAutoInstrumentations({
        // load custom configuration for xml-http-request instrumentation
        '@opentelemetry/instrumentation-xml-http-request': {
          clearTimingResources: true,
          propagateTraceHeaderCorsUrls: [/.+/g]
        }
      })
    ]
  })
}
