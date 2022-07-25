import Vue from 'vue'
import { createApolloProvider, ApolloProvider } from '@vue/apollo-option'
import { ApolloClient, ApolloLink, InMemoryCache, split } from '@apollo/client/core'
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

// Name of the localStorage item
const AUTH_TOKEN = LocalStorageKeys.AuthToken
// Http endpoint
const httpEndpoint = `${window.location.origin}/graphql`
// WS endpoint
const wsEndpoint = `${window.location.origin.replace('http', 'ws')}/graphql`
// app version
const appVersion = process.env.SPECKLE_SERVER_VERSION || 'unknown'

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
    typePolicies: {
      Query: {
        fields: {
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
            keyArgs: false,
            merge: buildAbstractCollectionMergeFunction('StreamCollection', {
              checkIdentity: true
            })
          }
        }
      },
      User: {
        fields: {
          timeline: {
            keyArgs: false,
            merge: buildAbstractCollectionMergeFunction('ActivityCollection')
          },
          commits: {
            keyArgs: false,
            merge: buildAbstractCollectionMergeFunction('CommitCollectionUser', {
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
            keyArgs: false,
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
    }
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
  }

  return link
}

function createApolloClient() {
  const cache = createCache()
  const wsClient = createWsClient()
  const link = createLink(wsClient)

  const apolloClient = new ApolloClient({
    link,
    cache,
    ssrForceFetchDelay: 100,
    connectToDevTools: process.env.NODE_ENV !== 'production',
    name: 'web',
    version: appVersion
  })

  return {
    apolloClient,
    wsClient
  }
}

/**
 * Create a Vue Apollo provider instance
 */
export function createProvider(): ApolloProvider {
  // Create apollo client
  const { apolloClient, wsClient } = createApolloClient()
  apolloClient.wsClient = hasAuthToken() ? wsClient : null

  // Create vue apollo provider
  const apolloProvider = createApolloProvider({
    defaultClient: apolloClient
  })

  return apolloProvider
}

export function installVueApollo(apolloProvider: ApolloProvider): void {
  // Install apollo provider (it's done weirdly cause it's meant to be used with vue 3)
  Vue.config.globalProperties ||= {}
  Vue.prototype.$apolloProvider = apolloProvider
  apolloProvider.install(Vue)
}
