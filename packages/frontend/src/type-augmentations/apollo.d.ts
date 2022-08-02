declare module '@apollo/client/core' {
  interface ApolloClient {
    wsClient?:
      | import('subscriptions-transport-ws').SubscriptionClient
      | null
      | undefined
  }
}

export {}
