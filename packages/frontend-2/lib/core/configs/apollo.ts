/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApolloLink, InMemoryCache, split, from } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import type { ApolloConfigResolver } from '~~/lib/core/nuxt-modules/apollo/module'
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { Kind } from 'graphql'
import type { OperationDefinitionNode } from 'graphql'
import type { CookieRef, NuxtApp } from '#app'
import type { Optional } from '@speckle/shared'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import {
  buildAbstractCollectionMergeFunction,
  buildArrayMergeFunction,
  incomingOverwritesExistingMergeFunction,
  mergeAsObjectsFunction
} from '~~/lib/core/helpers/apolloSetup'
import { onError } from '@apollo/client/link/error'
import { useNavigateToLogin, loginRoute } from '~~/lib/common/helpers/route'
import { useAppErrorState } from '~~/lib/core/composables/error'
import { isInvalidAuth } from '~~/lib/common/helpers/graphql'
import { isBoolean, omit } from 'lodash-es'
import { useRequestId } from '~/lib/core/composables/server'

const appName = 'frontend-2'

function createCache(): InMemoryCache {
  return new InMemoryCache({
    /**
     * This is where you configure how various GQL fields should be read, written to or merged when new data comes in.
     * If you define a merge function here, you don't need to duplicate the merge logic inside an `update()` callback
     * of a fetchMore call, for example.
     *
     * Feel free to re-use utilities in the `apolloSetup` helper for defining merge functions or even use the ones that come from `@apollo/client/utilities`.
     *
     * Read more: https://www.apollographql.com/docs/react/caching/cache-field-behavior
     */
    typePolicies: {
      Query: {
        fields: {
          otherUser: {
            read(original, { args, toReference }) {
              if (args?.id) {
                return toReference({ __typename: 'LimitedUser', id: args.id })
              }

              return original
            }
          },
          activeUser: {
            merge(existing, incoming, { mergeObjects }) {
              return mergeObjects(existing, incoming)
            },
            read(original, { args, toReference }) {
              if (args?.id) {
                return toReference({ __typename: 'User', id: args.id })
              }

              return original
            }
          },
          user: {
            read(original, { args, toReference }) {
              if (args?.id) {
                return toReference({ __typename: 'User', id: args.id })
              }

              return original
            }
          },
          stream: {
            read(original, { args, toReference }) {
              if (args?.id) {
                return toReference({ __typename: 'Stream', id: args.id })
              }

              return original
            }
          },
          streams: {
            keyArgs: ['query'],
            merge: buildAbstractCollectionMergeFunction('StreamCollection', {
              checkIdentity: true
            })
          },
          project: {
            read(original, { args, toReference }) {
              if (args?.id) {
                return toReference({ __typename: 'Project', id: args.id })
              }

              return original
            }
          },
          projects: {
            merge: buildArrayMergeFunction()
          },
          admin: {
            merge: mergeAsObjectsFunction
          },
          automateFunctions: {
            keyArgs: ['filter', 'limit'],
            merge: buildAbstractCollectionMergeFunction('AutomateFunctionCollection')
          }
        }
      },
      AdminQueries: {
        fields: {
          inviteList: {
            keyArgs: ['query'],
            merge: buildAbstractCollectionMergeFunction('AdminInviteList')
          },
          projectList: {
            keyArgs: ['query', 'visibility'],
            merge: buildAbstractCollectionMergeFunction('ProjectCollection')
          },
          userList: {
            keyArgs: ['query', 'role'],
            merge: buildAbstractCollectionMergeFunction('AdminUserList')
          }
        }
      },
      LimitedUser: {
        fields: {
          commits: {
            keyArgs: false,
            merge: buildAbstractCollectionMergeFunction('CommitCollection')
          }
        }
      },
      User: {
        fields: {
          timeline: {
            keyArgs: ['after', 'before'],
            merge: buildAbstractCollectionMergeFunction('ActivityCollection')
          },
          commits: {
            keyArgs: false,
            merge: buildAbstractCollectionMergeFunction('CommitCollection')
          },
          favoriteStreams: {
            keyArgs: false,
            merge: buildAbstractCollectionMergeFunction('StreamCollection')
          },
          projects: {
            keyArgs: ['filter', 'limit'],
            merge: buildAbstractCollectionMergeFunction('ProjectCollection')
          },
          versions: {
            keyArgs: ['authoredOnly', 'limit'],
            merge: buildAbstractCollectionMergeFunction('CountOnlyCollection')
          }
        }
      },
      Project: {
        fields: {
          models: {
            keyArgs: ['filter', 'limit'],
            merge: buildAbstractCollectionMergeFunction('ModelCollection')
          },
          versions: {
            keyArgs: ['filter', 'limit'],
            merge: buildAbstractCollectionMergeFunction('VersionCollection')
          },
          commentThreads: {
            keyArgs: ['filter', 'limit'],
            merge: buildAbstractCollectionMergeFunction('CommentCollection')
          },
          modelsTree: {
            keyArgs: ['filter', 'limit'],
            merge: buildAbstractCollectionMergeFunction('ModelsTreeItemCollection')
          },
          replyAuthors: {
            keyArgs: false,
            merge: buildAbstractCollectionMergeFunction('CommentReplyAuthorCollection')
          },
          automations: {
            keyArgs: ['filter', 'limit'],
            merge: buildAbstractCollectionMergeFunction('AutomationCollection')
          },
          viewerResources: {
            merge: (_existing, incoming) => [...incoming]
          },
          model: {
            read(original, { args, toReference }) {
              if (args?.id) {
                return toReference({ __typename: 'Model', id: args.id })
              }

              return original
            }
          },
          team: {
            merge: (_existing, incoming) => incoming
          },
          invitedTeam: {
            merge: (_existing, incoming) => incoming
          },
          pendingImportedModels: {
            merge: (_existing, incoming) => incoming
          }
        }
      },
      Model: {
        fields: {
          versions: {
            keyArgs: ['filter', 'limit'],
            merge: buildAbstractCollectionMergeFunction('VersionCollection')
          },
          pendingImportedVersions: {
            merge: (_existing, incoming) => incoming
          }
        }
      },
      Comment: {
        fields: {
          replies: {
            keyArgs: ['limit']
          }
        }
      },
      Stream: {
        fields: {
          activity: {
            keyArgs: ['after', 'before', 'actionType'],
            merge: buildAbstractCollectionMergeFunction('ActivityCollection')
          },
          commits: {
            keyArgs: false,
            merge: buildAbstractCollectionMergeFunction('CommitCollection', {
              checkIdentity: true
            })
          },
          pendingCollaborators: {
            merge: incomingOverwritesExistingMergeFunction
          },
          pendingAccessRequests: {
            merge: incomingOverwritesExistingMergeFunction
          }
        }
      },
      Branch: {
        fields: {
          commits: {
            keyArgs: false,
            merge: buildAbstractCollectionMergeFunction('CommitCollection', {
              checkIdentity: true
            })
          }
        }
      },
      BranchCollection: {
        merge: true
      },
      ServerStats: {
        merge: true
      },
      WebhookEventCollection: {
        merge: true
      },
      ServerInfo: {
        merge: true
      },
      CommentThreadActivityMessage: {
        merge: true
      },
      AutomateFunction: {
        fields: {
          releases: {
            keyArgs: ['filter', 'limit'],
            merge: buildAbstractCollectionMergeFunction(
              'AutomateFunctionReleaseCollection'
            )
          }
        }
      }
    }
  })
}

function createWsClient(params: {
  wsEndpoint: string
  authToken: CookieRef<Optional<string>>
  reqId: string
}): SubscriptionClient {
  const { wsEndpoint, authToken, reqId } = params

  // WS IN SSR DOESN'T WORK CURRENTLY CAUSE OF SOME NUXT TRANSPILATION WEIRDNESS
  // SO DON'T RUN createWsClient in SSR
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // const wsImplementation = process.server ? (await import('ws')).default : undefined
  return new SubscriptionClient(
    wsEndpoint,
    {
      reconnect: true,
      connectionParams: () => {
        const Authorization = authToken.value ? `Bearer ${authToken.value}` : null
        return Authorization
          ? { Authorization, headers: { Authorization, 'x-request-id': reqId } }
          : {}
      }
    }
    // wsImplementation
  )
}

function createLink(params: {
  httpEndpoint: string
  wsClient?: SubscriptionClient
  authToken: CookieRef<Optional<string>>
  nuxtApp: NuxtApp
  reqId: string
}): ApolloLink {
  const { httpEndpoint, wsClient, authToken, nuxtApp, reqId } = params
  const goToLogin = useNavigateToLogin()
  const { registerError, isErrorState } = useAppErrorState()

  const errorLink = onError((res) => {
    const logger = nuxtApp.$logger
    const isSubTokenMissingError = (res.networkError?.message || '').includes(
      'need a token to subscribe'
    )

    const skipLoggingErrors = res.operation.getContext().skipLoggingErrors
    const shouldSkip = isBoolean(skipLoggingErrors)
      ? skipLoggingErrors
      : skipLoggingErrors?.(res)
    if (!isSubTokenMissingError && !shouldSkip) {
      const errMsg = res.networkError?.message || res.graphQLErrors?.[0]?.message
      logger.error(
        {
          ...omit(res, ['forward', 'response']),
          networkErrorMessage: res.networkError?.message,
          gqlErrorMessages: res.graphQLErrors?.map((e) => e.message),
          errorMessage: errMsg,
          graphql: true
        },
        'Apollo Client error: {errorMessage}'
      )
    }

    const { networkError } = res
    if (networkError && isInvalidAuth(networkError)) {
      // Reset auth
      authToken.value = undefined

      // A bit hacky, but since this may happen mid-routing, a standard router.push call may not work
      if (process.client) {
        window.location.href = loginRoute
      } else {
        goToLogin()
      }
    }

    registerError()
  })

  // Prepare links
  const httpLink = createUploadLink({
    uri: httpEndpoint
  })

  const authLink = setContext((_, ctx) => {
    const { headers } = ctx
    const authHeader = authToken.value
      ? { Authorization: `Bearer ${authToken.value}` }
      : {}
    return {
      headers: {
        ...headers,
        ...authHeader,
        'x-request-id': reqId
      }
    }
  })

  let link = authLink.concat(httpLink)

  if (wsClient) {
    const wsLink = new WebSocketLink(wsClient)
    link = split(
      ({ query }) => {
        const definition = getMainDefinition(query) as OperationDefinitionNode
        const { kind, operation } = definition

        return kind === Kind.OPERATION_DEFINITION && operation === 'subscription'
      },
      wsLink,
      link
    )

    // Stopping WS when in error state
    wsClient.use([
      {
        applyMiddleware: (_opt, next) => {
          if (isErrorState.value) {
            return // never invokes next() - essentially stuck
          }

          next()
        }
      }
    ])
  }

  // SSR req logging link
  const loggerLink = new ApolloLink((operation, forward) => {
    const startTime = Date.now()
    const name = operation.operationName

    nuxtApp.$logger.debug(
      { operation: name, graphql: true },
      `Apollo operation {operation} started...`
    )
    return forward(operation).map((result) => {
      const elapsed = new Date().getTime() - startTime
      const success = !!(result.data && !result.errors?.length)

      nuxtApp.$logger.info(
        {
          operation: name,
          elapsed,
          success,
          graphql: true
        },
        `Apollo operation {operation} finished in {elapsed}ms`
      )

      return result
    })
  })

  return from([...(process.server ? [loggerLink] : []), errorLink, link])
}

const defaultConfigResolver: ApolloConfigResolver = () => {
  const {
    public: { speckleServerVersion = 'unknown' }
  } = useRuntimeConfig()
  const apiOrigin = useApiOrigin()
  const nuxtApp = useNuxtApp()
  const reqId = useRequestId()

  const httpEndpoint = `${apiOrigin}/graphql`
  const wsEndpoint = httpEndpoint.replace('http', 'ws')

  const authToken = useAuthCookie()
  const wsClient = process.client
    ? createWsClient({ wsEndpoint, authToken, reqId })
    : undefined
  const link = createLink({ httpEndpoint, wsClient, authToken, nuxtApp, reqId })

  return {
    // If we don't markRaw the cache, sometimes we get cryptic internal Apollo Client errors that essentially
    // result from parts of its internals being made reactive, even tho they shouldn't be
    cache: markRaw(createCache()),
    link,
    name: appName,
    version: speckleServerVersion
  }
}

export default defaultConfigResolver
