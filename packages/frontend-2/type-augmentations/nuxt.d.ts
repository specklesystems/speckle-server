/* eslint-disable @typescript-eslint/no-explicit-any */

type SpeckleNuxtAppInjections = {
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

declare module '@vue/runtime-core' {
  interface NuxtApp extends SpeckleNuxtAppInjections {
    $b: 0
  }
}

declare module '#app' {
  interface NuxtApp extends SpeckleNuxtAppInjections {
    $b: 0
  }
}

export {}
