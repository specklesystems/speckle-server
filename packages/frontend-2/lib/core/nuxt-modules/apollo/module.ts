import type { ApolloClientOptions } from '@apollo/client/core'
import type { MaybeAsync } from '@speckle/shared'
import type { NuxtApp } from '#app'
import { defineNuxtModule, addTemplate, createResolver, addPlugin } from 'nuxt/kit'

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
      nuxt: '>= 3.0.0 || 3.0.0-rc.13 || >= 4.0.0'
    }
  },
  hooks: {},
  setup(moduleOptions) {
    const resolver = createResolver(import.meta.url)

    if (!moduleOptions.configResolvers?.default) {
      throw new Error('No apollo client config resolvers registered!')
    }

    const imports = Object.entries(moduleOptions.configResolvers)
      .map(([key, path]) => `import ${key}Resolver from '${path}'`)
      .join('\n')
    const resolverMap = `const resolvers = {
      ${Object.keys(moduleOptions.configResolvers)
        .map((key) => `${key}: ${key}Resolver`)
        .join(',\n')}
    }`

    const templateContents = `${imports}\n${resolverMap}\nexport default resolvers`
    addTemplate({
      filename: 'apollo-config-resolvers.mjs',
      getContents: () => templateContents
    })

    addPlugin(resolver.resolve('./templates/plugin'))
  }
})
