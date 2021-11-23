const PostHog = require('posthog-node')

const client = new PostHog(
    process.env.POSTHOG_API_KEY,
    { host: 'https://posthog.insights.arup.com' }
)

module.exports = {
  identify(user) {
    client.identify({
      distinctId: user.id,
      properties: {
        email: user.email,
        name: user.name
      }
    })
  },
  capture(event, eventPayload) {
    client.capture({
      distinctId: eventPayload.user.id,
      event: event,
      properties: eventPayload
    })
  }
}