/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApolloLink, ApolloClientOptions } from '@apollo/client/core'
import { InMemoryCache, split, from } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { createUploadLink } from 'apollo-upload-client'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'
import type { OperationDefinitionNode } from 'graphql'
import { Kind } from 'graphql'
import type { Nullable } from '@speckle/shared'
import {
  buildAbstractCollectionMergeFunction,
  buildArrayMergeFunction,
  incomingOverwritesExistingMergeFunction
} from '~~/lib/core/helpers/apolloSetup'
import { onError } from '@apollo/client/link/error'
import * as Observability from '@speckle/shared/dist/esm/observability/index.js'

let subscriptionsStopped = false
const errorRpm = Observability.simpleRpmCounter()
const STOP_SUBSCRIPTIONS_AT_ERRORS_PER_MIN = 100

const appVersion = (import.meta.env.SPECKLE_SERVER_VERSION as string) || 'unknown'
const appName = 'dui-3'

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
      }
    }
  })
}

function createWsClient(params: {
  wsEndpoint: string
  authToken: () => Nullable<string>
}): SubscriptionClient {
  const { wsEndpoint, authToken } = params

  return new SubscriptionClient(wsEndpoint, {
    reconnect: true,
    reconnectionAttempts: 3,
    connectionParams: () => {
      const token = authToken()
      const Authorization = token?.length ? `Bearer ${token}` : null
      return Authorization ? { Authorization, headers: { Authorization } } : {}
    }
  })
}

function createLink(params: {
  httpEndpoint: string
  wsClient?: SubscriptionClient
  authToken: () => Nullable<string>
}): ApolloLink {
  const { httpEndpoint, wsClient, authToken } = params
  // Prepare links
  const httpLink = createUploadLink({
    uri: httpEndpoint
  })

  const authLink = setContext((_, { headers }) => {
    const token = authToken()
    const authHeader = token?.length ? { Authorization: `Bearer ${token}` } : {}
    return {
      headers: {
        ...headers,
        ...authHeader
      }
    }
  })

  let link = authLink.concat(httpLink as unknown as ApolloLink)

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

  const errorLink = onError((res) => {
    console.error('Apollo Client error', res)

    // Disable subscriptions if too many errors per minute
    const rpm = errorRpm.hit()
    if (
      import.meta.client &&
      wsClient &&
      !subscriptionsStopped &&
      rpm > STOP_SUBSCRIPTIONS_AT_ERRORS_PER_MIN
    ) {
      subscriptionsStopped = true
      console.error(
        `Too many errors (${rpm} errors per minute), stopping subscriptions!`
      )
      wsClient.use([
        {
          applyMiddleware: () => {
            // never invokes next() - essentially stuck
          }
        }
      ])
    }
  })

  return from([errorLink, link])
}

type ResolveClientConfigParams = {
  httpEndpoint: string
  authToken: () => Nullable<string>
}

export const resolveClientConfig = (
  params: ResolveClientConfigParams
): Pick<ApolloClientOptions<unknown>, 'cache' | 'link' | 'name' | 'version'> => {
  const { httpEndpoint, authToken } = params
  const wsEndpoint = httpEndpoint.replace('http', 'ws')

  const wsClient = import.meta.client
    ? createWsClient({ wsEndpoint, authToken })
    : undefined
  const link = createLink({ httpEndpoint, wsClient, authToken })

  return {
    // If we don't markRaw the cache, sometimes we get cryptic internal Apollo Client errors that essentially
    // result from parts of its internals being made reactive, even tho they shouldn't be
    cache: markRaw(createCache()),
    link,
    name: appName,
    version: appVersion
  }
}
