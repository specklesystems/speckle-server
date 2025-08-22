import configResolvers from '#build/apollo-config-resolvers.mjs'
import { ApolloClient, type ApolloClientOptions } from '@apollo/client/core'
import { defineNuxtPlugin } from '#app'
import { ApolloClients } from '@vue/apollo-composable'
import { markRaw, toRaw } from 'vue'

export default defineNuxtPlugin(async (nuxt) => {
  // in dev mode, load better messages
  if (import.meta.dev) {
    const devSettings = await import('@apollo/client/dev')
    devSettings.loadDevMessages()
  }

  // Load all configs
  const keyedConfigs: Record<string, ApolloClientOptions<unknown>> = {}
  for (const key of Object.keys(configResolvers)) {
    keyedConfigs[key] = await Promise.resolve(configResolvers[key](nuxt))
  }

  if (!keyedConfigs.default) {
    throw new Error("Couldn't successfully resolve config for default config!")
  }

  if (import.meta.client) {
    // Restore cached data from SSR
    for (const [key, config] of Object.entries(keyedConfigs)) {
      const cache = config.cache
      const restorable = window.__NUXT__?.apollo?.[key] || null

      if (restorable) {
        // Cache is proxified by Vue, gotta undo all that or all hell breaks loose
        cache.restore(markRaw(toRaw(restorable)))
        config.cache = cache
      }
    }
  }

  // Init clients
  let defaultClient: ApolloClient<unknown>,
    keyedClients: Record<string, ApolloClient<unknown>> = {}
  for (const [key, config] of Object.entries(keyedConfigs)) {
    const client = new ApolloClient({
      ...config,
      ...(import.meta.server ? { ssrMode: true } : { ssrForceFetchDelay: 100 }),
      connectToDevTools: !!import.meta.dev
    })
    if (key === 'default') {
      defaultClient = client
      if (import.meta.client && import.meta.dev) {
        window.__APOLLO_CLIENT__ = client
      }
    } else {
      keyedClients[key] = client
    }
  }

  // Make sure server side serializes state on render
  if (import.meta.server) {
    const ApolloSSR = await import('@vue/apollo-ssr')
    nuxt.hook('app:rendered', () => {
      nuxt.ssrContext!.payload.apollo = ApolloSSR.getStates({
        default: defaultClient,
        ...keyedClients
      })
    })
  }

  // For composable api
  const providedClients: Record<string, ApolloClient<unknown>> = {
    default: defaultClient!,
    ...keyedClients
  }
  nuxt.vueApp.provide(ApolloClients, providedClients)

  // For global access through $apollo
  nuxt.provide('apollo', providedClients)
})
