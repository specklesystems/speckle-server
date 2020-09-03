const Sentry = require( '@sentry/node' )
const { ApolloError } = require( 'apollo-server-express' )

module.exports = {
  requestDidStart( ) {
    return {
      didEncounterErrors( ctx ) {
        if ( !ctx.operation )
          return

        for ( const err of ctx.errors ) {
          if ( err instanceof ApolloError ) {
            continue
          }

          Sentry.withScope( scope => {
            scope.setTag( 'kind', ctx.operation.operation )
            scope.setExtra( 'query', ctx.request.query )
            scope.setExtra( 'variables', ctx.request.variables )
            if ( err.path ) {
              // We can also add the path as breadcrumb
              scope.addBreadcrumb( {
                category: "query-path",
                message: err.path.join( " > " ),
                level: Sentry.Severity.Debug
              } )
            }
            Sentry.captureException( err )
          } )
        }
      }
    }
  }
}
