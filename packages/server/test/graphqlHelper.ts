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
import { getUserFactory } from '@/modules/core/repositories/users'
import { db } from '@/db/knex'
import { pick } from 'lodash'

type TypedGraphqlResponse<R = Record<string, any>> = GraphQLResponse<R>

const getUser = getUserFactory({ db })

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
  const contextValue = context || apollo.context || (await createTestContext())

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
export const createTestContext = async (
  ctx?: Partial<GraphQLContext>
): Promise<GraphQLContext> =>
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

export const createAuthedTestContext = async (
  userId: string,
  ctxOverrides?: Partial<GraphQLContext>
): Promise<GraphQLContext> =>
  addLoadersToCtx({
    auth: true,
    userId,
    role: Roles.Server.User,
    token: 'asd',
    scopes: AllScopes,
    ...(ctxOverrides || {})
  })

const buildMergedContext = async (params: {
  /**
   * Base/initial context, if any
   */
  baseCtx?: GraphQLContext
  /**
   * Context overrides to apply at the very end
   */
  contextOverrides?: Array<Partial<GraphQLContext>>
  /**
   * If set, adjust context to be authed w/ all scopes and the actual user role for this user id.
   */
  authUserId?: string
}) => {
  let baseCtx: GraphQLContext = params.baseCtx || (await createTestContext())

  // Init ctx from userId?
  if (params?.authUserId) {
    const userData = await getUser(params.authUserId, { withRole: true })
    const role = userData?.role || Roles.Server.User
    const userCtx = await createAuthedTestContext(params.authUserId, { role })

    // Apply authed context to base
    baseCtx = {
      ...baseCtx,
      ...pick(userCtx, ['auth', 'userId', 'role', 'token', 'scopes'])
    }
  }

  // If ctx passed in also - merge them
  if (params?.contextOverrides?.length) {
    for (const ctx of params.contextOverrides) {
      baseCtx = {
        ...baseCtx,
        ...ctx
      }
    }
  }

  // Apply dataloaders from scratch
  baseCtx = await createTestContext(baseCtx)

  return baseCtx
}

/**
 * Utilities that make it easier to test against an Apollo Server instance
 */
export const testApolloServer = async (params?: {
  /**
   * Pass in a context to use. If used together with authUserId, the two contexts will be merged w/ these
   * overrides taking precedence
   */
  context?: Partial<GraphQLContext>
  /**
   * If set, will create an authed context w/ all scopes and the actual user role for this user id.
   * If user doesn't exist yet, will default to the User role
   */
  authUserId?: string
}) => {
  const baseCtx = await buildMergedContext({
    authUserId: params?.authUserId,
    contextOverrides: params?.context ? [params.context] : undefined
  })
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
       * Override context to use. If used together with authUserId, the two contexts will be merged w/ these
       * overrides taking precedence
       */
      context?: Partial<GraphQLContext>
      /**
       * If set, will create an authed context w/ all scopes and the actual user role for this user id.
       * If user doesn't exist yet, will default to the User role
       */
      authUserId?: string
      /**
       * Whether to add an assertion that there were no GQL errors
       */
      assertNoErrors: boolean
    }>
  ): Promise<ExecuteOperationResponse<R>> => {
    const operationCtx =
      options?.authUserId || options?.context
        ? await buildMergedContext({
            baseCtx,
            authUserId: options?.authUserId,
            contextOverrides: [...(options?.context ? [options.context] : [])]
          })
        : undefined

    const ctx = operationCtx || baseCtx

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
