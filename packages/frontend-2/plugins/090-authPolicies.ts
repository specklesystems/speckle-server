import type { NuxtApp } from '#app'
import { Authz } from '@speckle/shared'
import { buildAuthPolicyLoaders } from '~/lib/auth/loaders/index'

/**
 * Set up @speckle/shared authPolicies & their loaders
 */
export default defineNuxtPlugin(async (nuxt) => {
  const nuxtApp = nuxt as NuxtApp
  const loaders = buildAuthPolicyLoaders({ nuxtApp })

  return {
    provide: {
      authPolicies: {
        ...Authz.authPoliciesFactory(loaders),
        /**
         * Skips Apollo Cache the first time a query is requested. Useful in middlewares
         * where we want a fresh check to be invoked every time
         */
        noCache: () =>
          Authz.authPoliciesFactory(
            buildAuthPolicyLoaders({
              nuxtApp,
              options: { noCache: true }
            })
          )
      }
    }
  }
})
