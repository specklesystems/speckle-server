const PostHog = require('posthog-node')

const client = new PostHog(
    process.env.POSTHOG_API_KEY,
    { host: 'https://posthog.insights.arup.com' }
)

const { machineIdSync } = require( 'node-machine-id' )

const id = machineIdSync( )

module.exports = {
  startup() {
    if ( process.env.DISABLE_TRACKING !== 'true' ) {
      client.capture({
        distinctId: id,
        event: 'startup',
      })
    }
  },
  apolloHelper( actionName ) {
    if ( process.env.DISABLE_TRACKING !== 'true' ) {
      client.capture({
        distinctId: id,
        event: actionName || 'gql api call',
      })
      client.flush()
    }
  },
  matomoMiddleware( req, res, next ) {
    if ( process.env.DISABLE_TRACKING !== 'true' ) {
      client.capture({
        distinctId: id,
        event: req.url,
      })
    }
    next()
  }
}