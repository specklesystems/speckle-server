import { buildApolloServer } from '@/app'
import { Roles, AllScopes } from '@/modules/core/helpers/mainConstants'
import { addLoadersToCtx } from '@/modules/shared'

/**
 * Build an ApolloServer instance with an authenticated context
 */
export function buildAuthenticatedApolloServer(
  userId: string,
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

/**
 * Build an unauthenticated ApolloServer instance
 */
export function buildUnauthenticatedApolloServer() {
  return buildApolloServer({
    context: () =>
      addLoadersToCtx({
        auth: false
      })
  })
}
