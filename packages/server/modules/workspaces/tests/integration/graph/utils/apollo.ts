import { ApolloServer } from 'apollo-server-express'
import { AllScopes, Roles } from '@speckle/shared'
import { buildApolloServer } from '@/app'
import { addLoadersToCtx } from '@/modules/shared/middleware'

export const createTestApolloServer = async (
  userId: string,
  token: string
): Promise<ApolloServer> => {
  return await buildApolloServer({
    context: () => {
      return addLoadersToCtx({
        auth: true,
        userId,
        role: Roles.Server.Admin,
        token,
        scopes: AllScopes
      })
    }
  })
}
