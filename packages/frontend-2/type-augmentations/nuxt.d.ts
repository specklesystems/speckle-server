/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '#app' {
  interface NuxtApp {
    /**
     * Apollo clients provider
     */
    $apollo: {
      default: import('@apollo/client/core').ApolloClient<unknown>
    }

    /**
     * Used by useScopedState
     */
    __scopedStates?: Record<string | symbol, any>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    /**
     * Apollo clients provider
     */
    $apollo: {
      default: import('@apollo/client/core').ApolloClient<unknown>
    }

    /**
     * Used by useScopedState
     */
    __scopedStates?: Record<string | symbol, any>
  }
}

export {}
