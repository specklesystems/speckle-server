/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApolloServer } from 'apollo-server-express'
import { GraphQLResponse } from 'apollo-server-types'
import { DocumentNode } from 'graphql'
import { GraphQLContext, Nullable } from '@/modules/shared/helpers/typeHelper'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { buildApolloServer } from '@/app'
import { addLoadersToCtx } from '@/modules/shared/middleware'
import { buildUnauthenticatedApolloServer } from '@/test/serverHelper'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { AllScopes } from '@speckle/shared'

type TypedGraphqlResponse<R = Record<string, any>> = GraphQLResponse & {
  data: Nullable<R>
}

/**
 * Use this to execute GQL operations from tests against an Apollo instance and get
 * a properly typed response
 */
export async function executeOperation<
  R extends Record<string, any> = Record<string, any>,
  V extends Record<string, any> = Record<string, any>
>(
  apollo: ApolloServer,
  query: DocumentNode,
  variables?: V
): Promise<TypedGraphqlResponse<R>> {
  return (await apollo.executeOperation({
    query,
    variables
  })) as TypedGraphqlResponse<R>
}

/**
 * Create a test context for a GraphQL request. Optionally override any of the default values.
 * By default the context will be unauthenticated
 */
export const createTestContext = (
  ctx?: Partial<Parameters<typeof addLoadersToCtx>[0]>
): GraphQLContext =>
  addLoadersToCtx({
    auth: false,
    userId: undefined,
    role: undefined,
    token: undefined,
    scopes: [],
    stream: undefined,
    err: undefined,
    ...(ctx || {})
  })

/**
 * Utilities that make it easier to test against an Apollo Server instance
 */
export const testApolloServer = async (params?: {
  context?: GraphQLContext
  /**
   * If set, will create an authed context w/ all scopes and Server.User role for thies user id
   */
  authUserId?: string
}) => {
  const initialCtx: GraphQLContext | undefined = params?.authUserId
    ? createTestContext({
        auth: true,
        userId: params.authUserId,
        role: Roles.Server.User,
        token: 'asd',
        scopes: AllScopes
      })
    : params?.context

  const instance = initialCtx
    ? await buildApolloServer({
        context: initialCtx
      })
    : await buildUnauthenticatedApolloServer()

  /**
   * Execute an operation against Apollo and get a properly typed response
   */
  const execute = async <
    R extends Record<string, any> = Record<string, any>,
    V extends Record<string, any> = Record<string, any>
  >(
    query: TypedDocumentNode<R, V>,
    variables: V,
    options?: Partial<{
      /**
       * Optionally override the instance's context
       */
      context: Parameters<typeof createTestContext>[0]
    }>
  ): Promise<TypedGraphqlResponse<R>> => {
    const realInstance = options?.context
      ? await buildApolloServer({
          context: createTestContext({
            ...(initialCtx || {}),
            ...options.context
          })
        })
      : instance

    return (await realInstance.executeOperation({
      query,
      variables
    })) as TypedGraphqlResponse<R>
  }

  return { execute, server: instance }
}

export type TestApolloServer = Awaited<ReturnType<typeof testApolloServer>>
