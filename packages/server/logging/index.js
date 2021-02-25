/* istanbul ignore file */
const Sentry = require( '@sentry/node' )
const Tracing = require( '@sentry/tracing' )
const { machineIdSync } = require( 'node-machine-id' )

module.exports = function ( app ) {
  const id = machineIdSync( )

  if ( process.env.DISABLE_TRACING !== 'true' ) {
    Sentry.setUser( { id: id } )

    Sentry.init( {
      dsn: process.env.SENTRY_DSN || 'https://84171d4d992f43a5bc867a6694934b01@o436188.ingest.sentry.io/5416515',
      integrations: [
        new Sentry.Integrations.Http( { tracing: true } ),
        new Tracing.Integrations.Express( { app } )
      ],
      tracesSampleRate: 0.1
    } )

    app.use( Sentry.Handlers.requestHandler( ) )
    app.use( Sentry.Handlers.tracingHandler( ) )
  }
}
