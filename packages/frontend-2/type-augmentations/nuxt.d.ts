declare module 'nuxt/dist/app/nuxt' {
  interface NuxtApp {
    /**
     * Apollo clients provider
     */
    $apollo: {
      default: import('@apollo/client/core').ApolloClient<unknown>
    }
  }
}

export {}
