/* istanbul ignore file */
const Sentry = require( '@sentry/node' )

module.exports = function ( { err, kind, extras } ) {
  Sentry.withScope( scope => {
    if ( kind ) scope.setTag( 'kind', kind )
    if ( extras ) scope.setExtra( 'extras', extras )

    Sentry.captureException( err )
  } )
}
