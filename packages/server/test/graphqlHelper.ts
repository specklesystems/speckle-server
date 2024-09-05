/* eslint-disable @typescript-eslint/no-explicit-any */
import { DocumentNode } from 'graphql'
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { buildApolloServer } from '@/app'
import { addLoadersToCtx } from '@/modules/shared/middleware'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { AllScopes, MaybeNullOrUndefined } from '@speckle/shared'
import { expect } from 'chai'
import { ApolloServer, GraphQLResponse } from '@apollo/server'

type TypedGraphqlResponse<R = Record<string, any>> = GraphQLResponse<R>

export const getResponseResults = <TData = Record<string, unknown>>(
  res: GraphQLResponse<TData>
) => {
  const body = res.body
  if (body.kind === 'incremental') {
    return {
      data: body.initialResult.data as MaybeNullOrUndefined<TData>,
      errors: body.initialResult.errors
    }
  } else {
    return {
      data: body.singleResult.data as MaybeNullOrUndefined<TData>,
      errors: body.singleResult.errors
    }
  }
}

export type ExecuteOperationResponse<R extends Record<string, any>> = {
  res: TypedGraphqlResponse<R>
} & ReturnType<typeof getResponseResults<R>>

export type ServerAndContext = {
  apollo: ApolloServer<GraphQLContext>
  context?: MaybeNullOrUndefined<GraphQLContext>
}
export type ExecuteOperationServer = ServerAndContext

/**
 * Use this to execute GQL operations from tests against an Apollo instance and get
 * a properly typed response
 * @deprecated Use `testApolloServer` instead
 */
export async function executeOperation<
  R extends Record<string, any> = Record<string, any>,
  V extends Record<string, any> = Record<string, any>
>(
  apollo: ExecuteOperationServer,
  query: DocumentNode,
  variables?: V,
  context?: GraphQLContext
): Promise<ExecuteOperationResponse<R>> {
  const server: ApolloServer<GraphQLContext> = apollo.apollo
  const contextValue = context || apollo.context || createTestContext()

  const res = (await server.executeOperation(
    {
      query,
      variables
    },
    { contextValue }
  )) as TypedGraphqlResponse<R>

  const results = getResponseResults(res)

  // Replicate clearing dataloaders after each request
  contextValue.loaders.clearAll()

  return {
    ...results,
    res
  }
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

export const createAuthedTestContext = (
  userId: string,
  ctxOverrides?: Partial<Parameters<typeof addLoadersToCtx>[0]>
): GraphQLContext =>
  addLoadersToCtx({
    auth: true,
    userId,
    role: Roles.Server.User,
    token: 'asd',
    scopes: AllScopes,
    ...(ctxOverrides || {})
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
  let baseCtx: GraphQLContext
  if (params?.authUserId) {
    baseCtx = createAuthedTestContext(params.authUserId)
  } else if (params?.context) {
    baseCtx = params.context
  } else {
    baseCtx = createTestContext()
  }

  const instance = await buildApolloServer()

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
      /**
       * Whether to add an assertion that there were no GQL errors
       */
      assertNoErrors: boolean
    }>
  ): Promise<ExecuteOperationResponse<R>> => {
    const ctx = options?.context
      ? createTestContext({
          ...(baseCtx || {}),
          ...options.context
        })
      : baseCtx

    const res = (await instance.executeOperation(
      {
        query,
        variables
      },
      { contextValue: ctx }
    )) as TypedGraphqlResponse<R>

    if (options?.assertNoErrors) {
      expect(res).to.not.haveGraphQLErrors()
    }

    const results = getResponseResults(res)
    return {
      ...results,
      res
    }
  }

  return { execute, server: instance }
}

export type TestApolloServer = Awaited<ReturnType<typeof testApolloServer>>
export type ExecuteOperationOptions = Parameters<TestApolloServer['execute']>[2]
