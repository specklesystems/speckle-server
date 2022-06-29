const { buildApolloServer } = require('@/app')
const { Roles, AllScopes } = require('@/modules/core/helpers/mainConstants')
const { addLoadersToCtx } = require('@/modules/shared')

/**
 * Build an ApolloServer instance with an authenticated context
 * @param {string} userId
 * @param {string} role
 * @param {string} scopes
 */
function buildAuthenticatedApolloServer(
  userId,
  role = Roles.Server.User,
  scopes = AllScopes
) {
  return buildApolloServer({
    context: () =>
      addLoadersToCtx({
        auth: true,
        userId,
        role,
        token: 'asd',
        scopes
      })
  })
}

module.exports = {
  buildAuthenticatedApolloServer
}
