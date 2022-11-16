<% for (const [key, path] of Object.entries(options.configResolvers)) { %>
  import <%= key %>ConfigResolver from '<%= path %>';
<% } %>

import { ApolloClient } from '@apollo/client/core'
import { defineNuxtPlugin } from '#app'
import { ApolloClients, provideApolloClient } from '@vue/apollo-composable'

export default defineNuxtPlugin(async (nuxt) => {
  // Load all configs
  const keyedConfigs = {};
  <% for (const key of Object.keys(options.configResolvers)) { %>
    keyedConfigs['<%= key %>'] = await Promise.resolve(<%= key %>ConfigResolver(nuxt));
  <% } %>

  if (!keyedConfigs.default) {
    throw new Error("Couldn't successfully resolve config for default config!")
  }

  if (process.client) {
    // Restore cached data from SSR
    for (const [key, config] of Object.entries(keyedConfigs)) {
      /** @type {import('@apollo/client').InMemoryCache} */
      const cache = config.cache;
      cache.restore(window.__NUXT__?.apollo?.[key] || null);
      config.cache = cache;
    }
  }

  // Init clients
  let defaultClient,
      keyedClients = {};
  for (const [key, config] of Object.entries(keyedConfigs)) {
    const client = new ApolloClient({
      ...config,
      ...(process.server ? {ssrMode: true} : {ssrForceFetchDelay: 100}),
    });
    if (key === 'default') {
      defaultClient = client;
    } else {
      keyedClients[key] = client;
    }
  }

  // Make sure server side serializes state on render
  if (process.server) {
    const ApolloSSR = await import('@vue/apollo-ssr')
    nuxt.hook('app:rendered', () => {
      nuxt.ssrContext.payload.apollo = ApolloSSR.getStates({
        default: defaultClient,
        ...keyedClients
      })
    });
  }

    // For composable api
    const providedClients = {
      default: defaultClient,
      ...keyedClients
    };
    nuxt.vueApp.provide(ApolloClients, providedClients)

    // For global access through $apollo
    nuxt.provide("apollo", providedClients)
});
