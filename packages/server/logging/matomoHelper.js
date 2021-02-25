const Matomo = require ( 'matomo-tracker' )
const { machineIdSync } = require( 'node-machine-id' )

const id = machineIdSync( )
const mat = new Matomo( 7, 'https://speckle.matomo.cloud/matomo.php' )

module.exports = {
  startup() {
    if ( process.env.DISABLE_TRACKING !== 'true' ) {
      mat.track( {
        url: 'http://speckle.server',
        action_name: 'startup',
        uid: id,
        cip: id,
        token_auth: '8402f0bdd767c74cce86f710fe830a2c'
      } )
    }
  },
  apolloHelper( actionName ) {
    if ( process.env.DISABLE_TRACKING !== 'true' ) {
      mat.track( {
        url: 'http://speckle.server/gql',
        action_name: actionName || 'gql api call',
        cip: id,
        uid: id,
        token_auth: '8402f0bdd767c74cce86f710fe830a2c'
      } )
    }
  },
  matomoMiddleware( req, res, next ) {
    if ( process.env.DISABLE_TRACKING !== 'true' ) {
      mat.track( {
        url: req.url,
        action_name: 'api call',
        cip: id,
        uid: id,
        cvar: JSON.stringify( {
          '1': [ 'HTTP method', req.method ]
        } ),
        token_auth: '8402f0bdd767c74cce86f710fe830a2c'
      } )
    }
    next()
  }
}
