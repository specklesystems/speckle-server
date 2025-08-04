import { loadFeatureFlags } from '@speckle/shared/environment/featureFlags'

/**
 * Load feature flags in-memory, so that @speckle/shared internals can use them too.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const featureFlags = nuxtApp.$config.public
  loadFeatureFlags(featureFlags)
})
