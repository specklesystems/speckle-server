import { flatten } from 'lodash-es'
import type { StorybookConfig } from '@storybook/builder-vite'
import { mergeConfig, InlineConfig } from 'vite'
import jiti from 'jiti'

// having to use jiti cause of weird transpilation stuff going on during the storybook build
const jitiImport = jiti(import.meta.url, {
  cache: false,
  esmResolve: true
})
const nuxtViteConfigUtil = jitiImport(
  './lib/fake-nuxt-env/utils/nuxtViteConfig.mjs'
) as typeof import('~~/lib/fake-nuxt-env/utils/nuxtViteConfig.mjs')

const storyPaths = ['stories', 'components', 'pages', 'lib', 'layouts']
const storiesPairs = storyPaths.map((p) => [
  `../${p}/**/*.stories.mdx`,
  `../${p}/**/*.stories.@(js|ts)`
])
const stories = flatten(storiesPairs)

const config: StorybookConfig = {
  stories,
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y'
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
