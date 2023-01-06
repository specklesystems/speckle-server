/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApolloLink, InMemoryCache, split } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import type { ApolloConfigResolver } from '~~/lib/core/nuxt-modules/apollo/module'
import { createUploadLink } from 'apollo-upload-client'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { OperationDefinitionNode, Kind } from 'graphql'
import { CookieRef } from '#app'
import { Optional } from '@speckle/shared'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import {
  buildAbstractCollectionMergeFunction,
  buildArrayMergeFunction,
  incomingOverwritesExistingMergeFunction
} from '~~/lib/core/helpers/apolloSetup'

const appVersion = (import.meta.env.SPECKLE_SERVER_VERSION as string) || 'unknown'
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
          projects: {
            merge: buildArrayMergeFunction()
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
          },
          projects: {
            keyArgs: ['filter'],
            merge: buildAbstractCollectionMergeFunction('ProjectCollection', {
              checkIdentity: true
            })
          }
        }
      },
      Project: {
        fields: {
          models: {
            keyArgs: ['filter'],
            merge: buildAbstractCollectionMergeFunction('ModelCollection')
          },
          commentThreads: {
            keyArgs: false,
            merge: buildAbstractCollectionMergeFunction('CommentCollection')
          },
          replyAuthors: {
            keyArgs: false,
            merge: buildAbstractCollectionMergeFunction('CommentReplyAuthorCollection')
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
    }
  })
}

async function createWsClient(params: {
  wsEndpoint: string
  authToken: CookieRef<Optional<string>>
}): Promise<SubscriptionClient> {
  const { wsEndpoint, authToken } = params

  // WS IN SSR DOESN'T WORK CURRENTLY CAUSE OF SOME NUXT TRANSPILATION WEIRDNESS
  // SO DON'T RUN createWsClient in SSR
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const wsImplementation = process.server ? (await import('ws')).default : undefined
  return new SubscriptionClient(
    wsEndpoint,
    {
      reconnect: true,
      connectionParams: () => {
        const Authorization = authToken.value ? `Bearer ${authToken.value}` : null
        return Authorization ? { Authorization, headers: { Authorization } } : {}
      }
    },
    wsImplementation
  )
}

function createLink(params: {
  httpEndpoint: string
  wsClient?: SubscriptionClient
  authToken: CookieRef<Optional<string>>
}): ApolloLink {
  const { httpEndpoint, wsClient, authToken } = params

  // Prepare links
  const httpLink = createUploadLink({
    uri: httpEndpoint
  })

  const authLink = setContext(
    (_, { headers }: { headers: Record<string, unknown> }) => {
      const authHeader = authToken.value
        ? { Authorization: `Bearer ${authToken.value}` }
        : {}
      return {
        headers: {
          ...headers,
          ...authHeader
        }
      }
    }
  )

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

const defaultConfigResolver: ApolloConfigResolver = async () => {
  const {
    public: { apiOrigin }
  } = useRuntimeConfig()

  const httpEndpoint = `${apiOrigin}/graphql`
  const wsEndpoint = httpEndpoint.replace('http', 'ws')

  const authToken = useAuthCookie()
  const wsClient = process.client
    ? await createWsClient({ wsEndpoint, authToken })
    : undefined
  const link = createLink({ httpEndpoint, wsClient, authToken })

  return {
    cache: createCache(),
    link,
    name: appName,
    version: appVersion
  }
}

export default defaultConfigResolver
