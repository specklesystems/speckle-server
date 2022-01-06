
const { PgInstrumentation } = require( '@opentelemetry/instrumentation-pg' )
const { NodeTracerProvider } = require( '@opentelemetry/sdk-trace-node' )
const { registerInstrumentations } = require( '@opentelemetry/instrumentation' )
const { OTLPTraceExporter } = require( '@opentelemetry/exporter-trace-otlp-http' )
const { 
  BatchSpanProcessor, 
  SimpleSpanProcessor,
  ConsoleSpanExporter 
} = require( '@opentelemetry/sdk-trace-base' )
const { ExpressInstrumentation } = require( '@opentelemetry/instrumentation-express' )
const { HttpInstrumentation } = require( '@opentelemetry/instrumentation-http' )
const { RedisInstrumentation } = require( '@opentelemetry/instrumentation-redis' )
const {
  IORedisInstrumentation,
} = require( '@opentelemetry/instrumentation-ioredis' )
const { GraphQLInstrumentation } = require( '@opentelemetry/instrumentation-graphql' )
const { Resource } = require( '@opentelemetry/resources' )
const { SemanticResourceAttributes } = require( '@opentelemetry/semantic-conventions' )
const { KnexInstrumentation } = require( '@opentelemetry/instrumentation-knex' )
const { B3Propagator } = require( '@opentelemetry/propagator-b3' )

const opentelemetry = require( '@opentelemetry/api' )

// Not functionally required but gives some insight what happens behind the scenes
// const { diag, DiagConsoleLogger, DiagLogLevel } = opentelemetry
// diag.setLogger( new DiagConsoleLogger(), DiagLogLevel.INFO )

const collectorUrl = process.env.OTEL_URL 

exports.setup = () => {
  const exporter = new OTLPTraceExporter( {
    // url: '<your-collector-endpoint>/v1/traces', // url is optional and can be omitted - default is http://localhost:55681/v1/traces
    url: collectorUrl,
    headers: {}, // an optional object containing custom headers to be sent with each request
    concurrencyLimit: 10, // an optional limit on pending requests
  } )
  const provider = new NodeTracerProvider( {
    resource: new Resource( {
      [SemanticResourceAttributes.SERVICE_NAME]: 'speckle-server',
    } ),
  } )

  if ( collectorUrl ){
    provider.addSpanProcessor( new SimpleSpanProcessor( new ConsoleSpanExporter() ) )
    provider.addSpanProcessor(
      new BatchSpanProcessor( exporter, {
      // The maximum queue size. After the size is reached spans are dropped.
        maxQueueSize: 100,
        // The maximum batch size of every export. It must be smaller or equal to maxQueueSize.
        maxExportBatchSize: 10,
        // The interval between two consecutive exports
        scheduledDelayMillis: 500,
        // How long the export can run before it is cancelled
        exportTimeoutMillis: 30000
      } )
    )
  }
  provider.register( {
    propagator: new B3Propagator()
  } )

  registerInstrumentations( {
    instrumentations: [
      new PgInstrumentation(),
      new GraphQLInstrumentation( {
        depth: 2,
        mergeItems: true,
      } ),
      new KnexInstrumentation( {
        maxQueryLength: 100,
      } ),
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new RedisInstrumentation(),
      new IORedisInstrumentation( {
      } ),
    ],
  } )
}

exports.tracer = () => opentelemetry.trace.getTracer( 'speckle-server' )
