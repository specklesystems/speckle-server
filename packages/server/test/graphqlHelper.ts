/* eslint-disable @typescript-eslint/no-explicit-any */
import { DocumentNode, FormattedExecutionResult } from 'graphql'
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { buildApolloServer, buildApolloSubscriptionServer } from '@/app'
import { addLoadersToCtx } from '@/modules/shared/middleware'
import { Roles } from '@/modules/core/helpers/mainConstants'
import {
  AllScopes,
  buildManualPromise,
  ensureError,
  MaybeAsync,
  MaybeNullOrUndefined,
  Optional,
  timeoutAt
} from '@speckle/shared'
import { expect } from 'chai'
import { ApolloServer, GraphQLResponse } from '@apollo/server'
import { getUserFactory } from '@/modules/core/repositories/users'
import { db } from '@/db/knex'
import { pick, set } from 'lodash'
import { isTestEnv } from '@/modules/shared/helpers/envHelper'
import { publish, TestSubscriptions } from '@/modules/shared/utils/subscriptions'
import cryptoRandomString from 'crypto-random-string'
import * as MockSocket from 'mock-socket'
import type ws from 'ws'
import { createAuthTokenForUser } from '@/test/authHelper'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { WebSocketLink } from '@apollo/client/link/ws'
import { execute } from '@apollo/client/core'
import { PingPongDocument } from '@/test/graphql/generated/graphql'
import { BaseError } from '@/modules/shared/errors'
import EventEmitter from 'eventemitter2'

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

/**
 * In test env we use a ping sub as a readiness signal for other subscriptions
 * (there's no better way, no "is ready" event or anything)
 */
export const startEmittingTestSubs = async () => {
  if (!isTestEnv()) return undefined

  const intervalMs = 100
  const interval = setInterval(async () => {
    await publish(TestSubscriptions.Ping, { ping: new Date().toISOString() })
  }, intervalMs)

  return () => clearInterval(interval)
}

export class TestApolloSubscriptionError extends BaseError {
  static code = 'TEST_APOLLO_SUBSCRIPTION_ERROR'
  static defaultMessage = 'Unexpected issue occurred during test subscriptions'
}

/**
 * Utilities for quickly/easily testing GQL subscriptions without having to build real network servers & connections
 */
export const testApolloSubscriptionServer = async () => {
  const serverId = cryptoRandomString({ length: 16, type: 'url-safe' })
  const serverUrl = `ws://${serverId}.fakeWsServer:1234/graphql`

  const mockWsServer = new MockSocket.Server(serverUrl)
  set(mockWsServer, 'removeListener', mockWsServer.off.bind(mockWsServer)) // backwards compat w/ subscriptions-transport-ws

  const mockWs = MockSocket.WebSocket as unknown as ws.WebSocket
  const apolloSubServer = buildApolloSubscriptionServer(mockWsServer)

  // weakRef to ensure we dont prevent garbage collection
  const clients: WeakRef<SubscriptionClient>[] = []

  /**
   * Build subscription client. One per user is ideal.
   */
  const buildClient = async (params?: {
    /**
     * Real user id to auth the connection with. If unset, will be unauthenticated
     */
    authUserId?: string
  }) => {
    const { authUserId } = params || {}
    const token = authUserId ? await createAuthTokenForUser(authUserId) : undefined
    const wsClient = new SubscriptionClient(
      serverUrl,
      {
        reconnect: true,
        connectionParams: { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      },
      mockWs
    )
    clients.push(new WeakRef(wsClient))
    const clientLink = new WebSocketLink(wsClient)

    /**
     * Subscribe and return a fn for unsubscribing
     */
    const subscribe = async <
      R extends Record<string, any> = Record<string, any>,
      V extends Record<string, any> = Record<string, any>
    >(
      query: TypedDocumentNode<R, V>,
      variables: V,
      handler: (res: FormattedExecutionResult<R>) => MaybeAsync<void>
    ) => {
      const name = getOperationName(query)
      const buildLogMsg = (msg: string) => (name ? `[${name}] ${msg}` : msg)

      let processingErrors: unknown[] = []
      const messages: Array<FormattedExecutionResult<R>> = []

      const eventBus = new EventEmitter()
      const errHandler = (e: unknown) => {
        processingErrors.push(e)
      }
      eventBus.on('uncaughtException', errHandler)
      eventBus.on('error', errHandler)

      const observable = execute(clientLink, {
        query,
        variables
      })
      const sub = observable.subscribe(async (eventData) => {
        const res = eventData as FormattedExecutionResult<R>
        const asyncHandler = async () => handler(res)

        // Invoke handler
        try {
          await asyncHandler()
        } catch (e) {
          // If we throw here, this will be an unhandled rejection, lets throw in waitForMsg instead
          eventBus.emit('error', e)
        }

        // Mark msg received
        try {
          messages.push(res)
          await eventBus.emitAsync('message', res)
        } catch (e) {
          eventBus.emit('error', e)
        }
      })

      /**
       * Unsubscribe from the subscription
       */
      const unsub = () => {
        eventBus.removeAllListeners()
        sub.unsubscribe()
      }

      /**
       * Wait for a message to come in - it should be near instantenous, but it sometimes might occur in next ticks
       * due to the async nature of subscriptions
       */
      const waitForMessage = async (
        options?: Partial<{
          /**
           * Max time to wait for the message
           * Defaults to: 200
           */
          timeout: number

          /**
           * Whether to consider messages that have already arrived before the invocation of this function.
           * This is useful cause sometimes the message might arrive before we even start waiting for it.
           * Defaults to: true
           */
          allowPreviousMessages: boolean

          /**
           * Optionally wait for a specific kind of message
           */
          predicate: (msg: FormattedExecutionResult<R>) => boolean
        }>
      ) => {
        const { timeout = 200, allowPreviousMessages = true, predicate } = options || {}

        // First check for previous errors
        if (processingErrors.length) {
          const firstErr = processingErrors[0]
          processingErrors = []

          throw firstErr
        }

        // Then lets check previous messages
        if (allowPreviousMessages) {
          const found = messages.find((msg) => !predicate || predicate(msg))
          if (found) return // Found it!
        }

        // Now lets wait for incoming ones
        const unlisten = () => {
          eventBus.removeListener('message', onMessage)
          eventBus.removeListener('error', onError)
        }
        const onMessage = async (msg: FormattedExecutionResult<R>) => {
          if (!predicate || predicate(msg)) {
            retPromise.resolve()
            unlisten()
          }
        }
        const onError = (e: unknown) => {
          retPromise.reject(e)
          unlisten()
        }

        const retPromise = buildManualPromise<void>()
        eventBus.on('message', onMessage)
        eventBus.on('error', onError)

        try {
          await Promise.race([retPromise.promise, timeoutAt(timeout)])
        } catch (e) {
          throw new TestApolloSubscriptionError(
            buildLogMsg('waitForMessage() failed'),
            {
              cause: ensureError(e)
            }
          )
        }
      }

      const getMessages = () => messages.slice()

      return { unsub, waitForMessage, getMessages }
    }

    /**
     * Invoke this after subscribe() calls to ensure that your subscriptions are ready
     */
    const waitForReadiness = async () => {
      return new Promise<void>(async (resolve, reject) => {
        const { unsub } = await subscribe(PingPongDocument, {}, (res) => {
          if (!res.data?.ping) {
            return reject(new TestApolloSubscriptionError('Unexpected ping error'))
          }

          unsub()
          resolve()
        })

        timeoutAt(5000, 'waitForReadiness() timed out').catch(reject)
      })
    }

    /**
     * Close down the client
     */
    const quit = () => {
      wsClient.close()
    }

    return { subscribe, waitForReadiness, quit }
  }

  /**
   * Close down server and all clients
   */
  const quit = () => {
    for (const client of clients) {
      client.deref()?.close()
    }
    mockWsServer.close()
    apolloSubServer.close()
  }

  return {
    buildClient,
    quit
  }
}

export type TestApolloSubscriptionServer = Awaited<
  ReturnType<typeof testApolloSubscriptionServer>
>

export type TestApolloSubscriptionClient = Awaited<
  ReturnType<TestApolloSubscriptionServer['buildClient']>
>

const getOperationName = (query: DocumentNode) => {
  const operation = query.definitions.find((def) => def.kind === 'OperationDefinition')
  return (operation ? operation.name?.value : undefined) as Optional<string>
}
