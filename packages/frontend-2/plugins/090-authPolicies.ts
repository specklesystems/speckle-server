import type { NuxtApp } from '#app'
import { Authz } from '@speckle/shared'
import { buildAuthPolicyLoaders } from '~/lib/auth/loaders/index'

/**
 * Set up @speckle/shared authPolicies & their loaders
 */
export default defineNuxtPlugin(async (nuxt) => {
  const nuxtApp = nuxt as NuxtApp
  const [loaders, noCacheLoaders] = await Promise.all([
    buildAuthPolicyLoaders({ nuxtApp }),
    buildAuthPolicyLoaders({
      nuxtApp,
      options: { noCache: true }
    })
  ])

  return {
    provide: {
      authPolicies: {
        ...Authz.authPoliciesFactory(loaders),
        /**
         * Skips Apollo Cache and fetches fresh results from server. Useful in
         * middlewares where you want to re-check permissions on every navigation
         */
        noCache: Authz.authPoliciesFactory(noCacheLoaders)
      }
    }
  }
})
