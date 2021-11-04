const PostHog = require('posthog-node')

const client = new PostHog(
    process.env.POSTHOG_API_KEY,
    { host: 'https://posthog.insights.arup.com' }
)

const { machineIdSync } = require( 'node-machine-id' );

const id = machineIdSync( )

module.exports = {
  identify(user) {
    client.identify({
      distinctId: user.email,
      properties: user
    })
  },
  startup() {
    if ( process.env.DISABLE_TRACKING !== 'true' ) {
      client.capture({
        distinctId: id,
        event: 'startup',
      })
    }
  },
  apolloHelper( actionName, email, serverName) {
    if ( process.env.DISABLE_TRACKING !== 'true' ) {
      client.capture({
        distinctId: email || id,
        event: actionName || 'gql api call',
        properties: {
          serverName
        }
      })
    }
  },
  matomoMiddleware( req, res, next ) {
    if ( process.env.DISABLE_TRACKING !== 'true' ) {
      let distinctId = id
      let serverName = 'unknown'
      
      if(req.context && req.context.email) {
        distinctId = req.context.email
      }

      if(req.context && req.context.serverName) {
        serverName = req.context.serverName
      }
    
      client.capture({
        distinctId: distinctId,
        event: req.url,
        properties: {
          serverName
        }
      })
    }
    next()
  }
}