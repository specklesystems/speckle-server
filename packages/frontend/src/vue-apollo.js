/* eslint-disable */
import Vue from 'vue'
import VueApollo from 'vue-apollo'
import {
  createApolloClient,
  restartWebsockets
} from 'vue-cli-plugin-apollo/graphql-client'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { LocalStorageKeys } from '@/helpers/mainConstants'

// Install the vue plugin
Vue.use(VueApollo)

// Name of the localStorage item
const AUTH_TOKEN = LocalStorageKeys.AuthToken
// Http endpoint
const httpEndpoint = `${window.location.origin}/graphql`
// WS endpoint
const wsEndpoint = `${window.location.origin.replace('http', 'ws')}/graphql`
// app version
const appVersion = process.env.SPECKLE_SERVER_VERSION || 'unknown'

function hasAuthToken() {
  return !!localStorage.getItem(AUTH_TOKEN)
}

function createSubscriptionClient() {
  return new SubscriptionClient(wsEndpoint, {
    reconnect: hasAuthToken(),
    connectionParams: {
      headers: {
        Authorization: localStorage.getItem(AUTH_TOKEN)
      }
    }
  })
}

function getDefaultOptions() {
  return {
    // You can use `https` for secure connection (recommended in production)
    httpEndpoint,
    // You can use `wss` for secure connection (recommended in production)
    // Use `null` to disable subscriptions
    wsEndpoint: hasAuthToken() ? wsEndpoint : null,
    // LocalStorage token
    tokenName: AUTH_TOKEN,
    // Enable Automatic Query persisting with Apollo Engine
    persisting: false,
    // Use websockets for everything (no HTTP)
    // You need to pass a `wsEndpoint` for this to work
    websocketsOnly: false,
    // Is being rendered on the server?
    ssr: false,
    // Subscription Client
    networkInterface: createSubscriptionClient(),
    // Extra cache settings
    inMemoryCacheOptions: {
      cacheRedirects: {
        Query: {
          user: (_, args, { getCacheKey }) =>
            getCacheKey({ __typename: 'User', id: args?.id }),
          stream: (_, args, { getCacheKey }) =>
            getCacheKey({ __typename: 'Stream', id: args.id })
        }
      }
    },
    // Extra ApolloClient ctor options
    apollo: {
      name: 'web',
      version: appVersion
    }
  }
}
/**
 * Create a Vue Apollo provider instance
 */
export function createProvider(options = {}) {
  // console.log( defaultOptions )
  // Create apollo client
  const { apolloClient, wsClient } = createApolloClient({
    ...getDefaultOptions(),
    ...options
  })
  apolloClient.wsClient = hasAuthToken() ? wsClient : null

  // Create vue apollo provider
  const apolloProvider = new VueApollo({
    defaultClient: apolloClient,
    defaultOptions: {
      $query: {
        // fetchPolicy: 'cache-and-network',
      }
    },
    errorHandler(error) {
      // eslint-disable-next-line no-console
      // console.log( '%cError', 'background: red; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;', error.message )
    }
  })

  return apolloProvider
}

// Manually call this when user log in
export async function onLogin(apolloClient, token) {
  if (typeof localStorage !== 'undefined' && token) {
    localStorage.setItem(AUTH_TOKEN, token)
  }
  if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
  try {
    await apolloClient.resetStore()
  } catch (e) {
    // eslint-disable-next-line no-console
    // console.log( '%cError on cache reset (login)', 'color: orange;', e.message )
  }
}

// Manually call this when user log out
export async function onLogout(apolloClient) {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN)
  }
  if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
  try {
    await apolloClient.resetStore()
  } catch (e) {
    // eslint-disable-next-line no-console
    // console.log( '%cError on cache reset (logout)', 'color: orange;', e.message )
  }
}
