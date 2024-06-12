/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Vue from 'vue'
import { createApolloProvider, ApolloProvider } from '@vue/apollo-option'
import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  split,
  TypePolicies,
  from
} from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { WebSocketLink } from '@apollo/client/link/ws'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { LocalStorageKeys } from '@/helpers/mainConstants'
import { createUploadLink } from 'apollo-upload-client'
import { AppLocalStorage } from '@/utils/localStorage'
import { getMainDefinition } from '@apollo/client/utilities'
import { OperationDefinitionNode, Kind } from 'graphql'
import {
  buildAbstractCollectionMergeFunction,
  incomingOverwritesExistingMergeFunction
} from '@/main/lib/core/helpers/apolloSetupHelper'
import { merge } from 'lodash'
import { statePolicies as commitObjectViewerStatePolicies } from '@/main/lib/viewer/commit-object-viewer/stateManagerCore'
import { Optional } from '@speckle/shared'
import { onError } from '@apollo/client/link/error'
import { registerError, isErrorState } from '@/main/lib/core/utils/appErrorStateManager'
import { isInvalidAuth } from '@/helpers/errorHelper'
import { signOut } from '@/plugins/authHelpers'

// Name of the localStorage item
const AUTH_TOKEN = LocalStorageKeys.AuthToken
// Http endpoint
const httpEndpoint = `${window.location.origin}/graphql`
// WS endpoint
const wsEndpoint = `${window.location.origin.replace('http', 'ws')}/graphql`
// app version
const appVersion = (import.meta.env.SPECKLE_SERVER_VERSION || 'unknown') as string

let instance: Optional<ApolloProvider> = undefined

function hasAuthToken() {
  return !!AppLocalStorage.get(AUTH_TOKEN)
}

function createCache(): InMemoryCache {
  return new InMemoryCache({
    /**
     * This is where you configure how various GQL fields should be read, written to or merged when new data comes in.
     * If you define a merge function here, you don't need to duplicate the merge logic inside an `update()` callback
     * of a fetchMore call, for example.
     *
     * Feel free to re-use utilities in `apolloSetupHelper` for defining merge functions or even use the ones that come from `@apollo/client/utilities`.
     *
     * Read more: https://www.apollographql.com/docs/react/caching/cache-field-behavior
     */
    typePolicies: merge<TypePolicies, TypePolicies>(
      {
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
            }
          }
        },
        LimitedUser: {
          fields: {
            commits: {
              keyArgs: false,
              merge: buildAbstractCollectionMergeFunction('CommitCollection', {
                checkIdentity: true
              })
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
              merge: buildAbstractCollectionMergeFunction('CommitCollection', {
                checkIdentity: true
              })
            },
            favoriteStreams: {
              keyArgs: false,
              merge: buildAbstractCollectionMergeFunction('StreamCollection', {
                checkIdentity: true
              })
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
        }
      },
      commitObjectViewerStatePolicies
    )
  })
}

function createWsClient(): SubscriptionClient {
  return new SubscriptionClient(wsEndpoint, {
    reconnect: true,
    connectionParams: () => {
      const authToken = AppLocalStorage.get(AUTH_TOKEN)
      const Authorization = authToken ? `Bearer ${authToken}` : null
      return Authorization ? { Authorization, headers: { Authorization } } : {}
    }
  })
}

function createLink(wsClient?: SubscriptionClient): ApolloLink {
  // Prepare links
  const httpLink = createUploadLink({
    uri: httpEndpoint
  })
  const authLink = setContext(async (_, { headers }) => {
    const authToken = AppLocalStorage.get(AUTH_TOKEN)
    const authHeader = authToken ? { Authorization: `Bearer ${authToken}` } : {}
    return {
      headers: {
        ...headers,
        ...authHeader
      }
    }
  })
  let link = authLink.concat(httpLink)

  // WS link
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
          if (isErrorState()) {
            return // never invokes next() - essentially stuck
          }

          next()
        }
      }
    ])
  }

  // Global error handling
  const errorLink = onError((res) => {
    const { networkError } = res
    if (networkError && isInvalidAuth(networkError)) {
      // Logout
      void signOut()
    }

    registerError()
  })

  return from([errorLink, link])
}

function createApolloClient() {
  const cache = createCache()
  const wsClient = createWsClient()
  const link = createLink(wsClient)

  const apolloClient = new ApolloClient({
    link,
    cache,
    ssrForceFetchDelay: 100,
    connectToDevTools: import.meta.env.DEV,
    name: 'web',
    version: appVersion
  })

  return {
    apolloClient,
    wsClient
  }
}

/**
 * Create and set a global Vue Apollo provider instance
 */
export function createProvider(): ApolloProvider {
  // Create apollo client
  const { apolloClient, wsClient } = createApolloClient()
  apolloClient.wsClient = hasAuthToken() ? wsClient : null

  // Create vue apollo provider
  const apolloProvider = createApolloProvider({
    defaultClient: apolloClient
  })
  instance = apolloProvider

  return apolloProvider
}

export function getApolloProvider(): ApolloProvider {
  if (!instance) {
    throw new Error('Attempting to use unitialized global Apollo Provider')
  }

  return instance
}

export function installVueApollo(apolloProvider: ApolloProvider): void {
  // Install apollo provider (it's done weirdly cause it's meant to be used with vue 3)
  Vue.config.globalProperties ||= {}
  Vue.prototype.$apolloProvider = apolloProvider
  apolloProvider.install(Vue)
}
