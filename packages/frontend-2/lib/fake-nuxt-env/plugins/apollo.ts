import { Plugin } from 'vue'
import defaultConfigResolver from '~~/lib/core/configs/apollo'
import { ApolloClient } from '@apollo/client/core'
import { NuxtApp } from '#app'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { setClient } from '~~/lib/fake-nuxt-env/singletons/apollo'

async function installApollo() {
  const config = await defaultConfigResolver({} as NuxtApp)

  // Init client
  const client = new ApolloClient({
    ...config,
    ssrMode: false
  })
  setClient(client)

  const vuePlugin: Plugin = (app) => {
    app.provide(DefaultApolloClient, client)
  }

  return {
    vuePlugin
  }
}

export default installApollo
