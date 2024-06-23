import type { NuxtApp } from 'nuxt/dist/app/nuxt'

/**
 * Similar to nuxt's useState() except state is scoped to only the SSR request or only the client-side session.
 * The state doesn't get serialized in SSR and thus won't be transferred to the client-side session
 */
export function useScopedState<T>(key: string | symbol, init: () => T) {
  const nuxtApp = useNuxtApp() as NuxtApp

  if (!nuxtApp.__scopedStates) {
    nuxtApp.__scopedStates = {}
  }

  if (!nuxtApp.__scopedStates[key]) {
    nuxtApp.__scopedStates[key] = init()
  }

  return nuxtApp.__scopedStates[key] as T
}
