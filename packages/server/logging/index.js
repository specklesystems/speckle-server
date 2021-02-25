/* istanbul ignore file */
const Sentry = require( '@sentry/node' )
const Tracing = require( '@sentry/tracing' )
const Matomo = require ( 'matomo-tracker' )
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

  if ( process.env.DISABLE_TRACKING !== 'true' ) {

    let mat = new Matomo( 7, 'https://speckle.matomo.cloud/matomo.php' )
    let token = '8402f0bdd767c74cce86f710fe830a2c'
    mat.track( {
      url: 'http://speckle.server',
      action_name: 'startup',
      uid: id,
      cip: id,
      token_auth: token
    } )

    let middleware = ( req, res, next ) => {
      mat.track( {
        url: req.url,
        action_name: 'api call',
        cip: id,
        uid: id,
        cvar: JSON.stringify( {
          '1': [ 'HTTP method', req.method ]
        } ),
        token_auth: token
      } )
      next()
    }

    app.use( middleware )
  }
}
