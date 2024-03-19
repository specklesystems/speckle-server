import path from 'path'
import type { ApolloClientOptions } from '@apollo/client/core'
import { addPluginTemplate, defineNuxtModule } from '@nuxt/kit'
import type { MaybeAsync } from '@speckle/shared'
import type { NuxtApp } from 'nuxt/dist/app/nuxt'

/**
 * Config resolver default exported function expected type
 */
export type ApolloConfigResolver = (
  nuxt: NuxtApp
) => MaybeAsync<ApolloClientOptions<unknown>>

export interface ApolloModuleOptions {
  /**
   * Paths to config resolver scripts for each client. `default` represents the main/default client, but extra clients
   * can be defined through defining extra config resolvers.
   */
  configResolvers?: {
    default: string
    [clientKey: string]: string
  }
}

export default defineNuxtModule<ApolloModuleOptions>({
  meta: {
    name: 'apollo-module',
    configKey: 'apollo',
    compatibility: {
      nuxt: '>= 3.0.0 || 3.0.0-rc.13'
    }
  },
  hooks: {},
  setup(moduleOptions) {
    if (!moduleOptions.configResolvers?.default) {
      throw new Error('No apollo client config resolvers registered!')
    }

    addPluginTemplate({
      src: path.resolve(__dirname, './templates/plugin.js'),
      options: {
        configResolvers: moduleOptions.configResolvers
      }
    })
  }
})
