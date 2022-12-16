/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'nuxt/dist/app/nuxt' {
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

    /**
     * Viewer Nuxt Plugin (client only)
     */
    $viewer: Promise<Viewer>
    $viewerContainer: HTMLElement
  }
}

export {}
