import { ApolloLink, InMemoryCache, split } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import type { ApolloConfigResolver } from '~~/lib/core/nuxt-modules/apollo/module'
import { createUploadLink } from 'apollo-upload-client'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { OperationDefinitionNode, Kind } from 'graphql'
import { useAuthToken, TokenRetriever } from '~~/lib/auth/utils/authState'

// TODO: Store common apollo configs & helpers in @speckle/shared

const appVersion = (import.meta.env.SPECKLE_SERVER_VERSION as string) || 'unknown'
const appName = 'frontend-2'

async function createWsClient(params: {
  wsEndpoint: string
  getToken: TokenRetriever
}): Promise<SubscriptionClient> {
  const { wsEndpoint, getToken } = params

  // WS IN SSR DOESN'T WORK CURRENTLY CAUSE OF SOME NUXT TRANSPILATION WEIRDNESS
  // SO DON'T RUN createWsClient in SSR
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const wsImplementation = process.server ? (await import('ws')).default : undefined
  return new SubscriptionClient(
    wsEndpoint,
    {
      reconnect: true,
      connectionParams: () => {
        const authToken = getToken()
        const Authorization = authToken ? `Bearer ${authToken}` : null
        return Authorization ? { Authorization, headers: { Authorization } } : {}
      }
    },
    wsImplementation
  )
}

function createLink(params: {
  httpEndpoint: string
  wsClient?: SubscriptionClient
  getToken: TokenRetriever
}): ApolloLink {
  const { httpEndpoint, wsClient, getToken } = params

  // Prepare links
  const httpLink = createUploadLink({
    uri: httpEndpoint
  })

  const authLink = setContext(
    (_, { headers }: { headers: Record<string, unknown> }) => {
      const authToken = getToken()
      const authHeader = authToken ? { Authorization: `Bearer ${authToken}` } : {}
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
    public: { API_ORIGIN }
  } = useRuntimeConfig()

  const httpEndpoint = `${API_ORIGIN}/graphql`
  const wsEndpoint = httpEndpoint.replace('http', 'ws')

  const getToken = useAuthToken()
  const wsClient = process.client
    ? await createWsClient({ wsEndpoint, getToken })
    : undefined
  const link = createLink({ httpEndpoint, wsClient, getToken })

  return {
    cache: new InMemoryCache(),
    link,
    name: appName,
    version: appVersion
  }
}

export default defaultConfigResolver
