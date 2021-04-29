/* eslint-disable */
import Vue from 'vue'
import VueApollo from 'vue-apollo'
import { createApolloClient, restartWebsockets } from 'vue-cli-plugin-apollo/graphql-client'
import { SubscriptionClient } from 'subscriptions-transport-ws';

// Install the vue plugin
Vue.use( VueApollo )

// Name of the localStorage item
const AUTH_TOKEN = 'AuthToken'
let hasAuthToken = !!localStorage.getItem(AUTH_TOKEN)

// Http endpoint
const httpEndpoint = process.env.VUE_APP_GRAPHQL_HTTP || `${window.location.origin}/graphql`
// WS endpoint
const wsEndpoint = process.env.VUE_APP_GRAPHQL_WS || `${window.location.origin.replace('http', 'ws')}/graphql`

// Subscription Client
const subscriptionClient = new SubscriptionClient( wsEndpoint, {
  reconnect: hasAuthToken,
  connectionParams:{
    headers:{
      'Authorization' : localStorage.getItem(AUTH_TOKEN)
    }
  }
} )

// Config
const defaultOptions = {
  // You can use `https` for secure connection (recommended in production)
  httpEndpoint,
  // You can use `wss` for secure connection (recommended in production)
  // Use `null` to disable subscriptions
  wsEndpoint: hasAuthToken ? wsEndpoint : null,
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
  networkInterface: subscriptionClient

  // Override default apollo link
  // note: don't override httpLink here, specify httpLink options in the
  // httpLinkOptions property of defaultOptions.
  // link: myLink

  // Override default cache
  // cache: myCache

  // Override the way the Authorization header is set
  // getAuth: (tokenName) => ...

  // Additional ApolloClient options
  // apollo: { ... }

  // Client local data (see apollo-link-state)
  // clientState: { resolvers: { ... }, defaults: { ... } }
}

// Call this in the Vue app file
export function createProvider( options = {} ) {
  // console.log( defaultOptions )
  // Create apollo client
  const { apolloClient, wsClient } = createApolloClient( {
    ...defaultOptions,
    ...options,
  } )
  apolloClient.wsClient = hasAuthToken ? wsClient : null

  // Create vue apollo provider
  const apolloProvider = new VueApollo( {
    defaultClient: apolloClient,
    defaultOptions: {
      $query: {
        // fetchPolicy: 'cache-and-network',
      },
    },
    errorHandler( error ) {
      // eslint-disable-next-line no-console
      console.log( '%cError', 'background: red; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;', error.message )
    },
  } )

  return apolloProvider
}

// Manually call this when user log in
export async function onLogin( apolloClient, token ) {
  if ( typeof localStorage !== 'undefined' && token ) {
    localStorage.setItem( AUTH_TOKEN, token )
  }
  if ( apolloClient.wsClient ) restartWebsockets( apolloClient.wsClient )
  try {
    await apolloClient.resetStore( )
  } catch ( e ) {
    // eslint-disable-next-line no-console
    console.log( '%cError on cache reset (login)', 'color: orange;', e.message )
  }
}

// Manually call this when user log out
export async function onLogout( apolloClient ) {
  if ( typeof localStorage !== 'undefined' ) {
    localStorage.removeItem( AUTH_TOKEN )
  }
  if ( apolloClient.wsClient ) restartWebsockets( apolloClient.wsClient )
  try {
    await apolloClient.resetStore( )
  } catch ( e ) {
    // eslint-disable-next-line no-console
    console.log( '%cError on cache reset (logout)', 'color: orange;', e.message )
  }
}
