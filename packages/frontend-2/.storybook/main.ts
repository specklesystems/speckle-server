import type { StorybookConfig } from '@storybook/builder-vite'
import { mergeConfig, InlineConfig } from 'vite'
import jiti from 'jiti'

// having to use jiti cause of weird transpilation stuff going on during the storybook build
// debugger
const jitiImport = jiti(import.meta.url, {
  // debug: true,
  cache: false,
  esmResolve: true
})
const nuxtViteConfigUtil = jitiImport(
  './lib/fake-nuxt-env/utils/nuxtViteConfig.mjs'
) as typeof import('~~/lib/fake-nuxt-env/utils/nuxtViteConfig.mjs')

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions'
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {}
  },
  async viteFinal(config) {
    const customConfig: InlineConfig = {
      resolve: {
        alias: {
          // not sure why, but storybook tries to bundle "crypto"
          crypto: require.resolve('rollup-plugin-node-builtins')
        }
      }
    }
    const nuxtConfig = await nuxtViteConfigUtil.getNuxtViteConfig()

    let final = mergeConfig(config, nuxtConfig)
    final = mergeConfig(final, customConfig)

    return final
  }
}

export default config
