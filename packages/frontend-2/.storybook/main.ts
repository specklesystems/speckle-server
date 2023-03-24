import dotenv from 'dotenv'
import Unimport from 'unimport/unplugin'
import { flatten } from 'lodash-es'
import type { StorybookConfig } from '@storybook/vue3-vite'
import { mergeConfig, InlineConfig } from 'vite'
import jiti from 'jiti'

// used in nuxt.config.ts
process.env.IS_STORYBOOK_BUILD = 'true'

// make nuxt env vars available here
dotenv.config()

// having to use jiti cause of weird transpilation stuff going on during the storybook build
const jitiImport = jiti(__filename, {
  cache: false,
  esmResolve: true
})
const nuxtViteConfigUtil = jitiImport(
  '../lib/fake-nuxt-env/utils/nuxtViteConfig.mjs'
) as typeof import('~~/lib/fake-nuxt-env/utils/nuxtViteConfig.mjs')
const storyPaths = ['stories', 'components', 'pages', 'lib', 'layouts']
const storiesPairs = storyPaths.map((p) => [
  `../${p}/**/*.mdx`,
  `../${p}/**/*.stories.@(js|ts)`
])
const stories = flatten(storiesPairs)

/**
 * STORYBOOK CONFIG STARTS HERE
 */
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
  features: {
    storyStoreV7: true
  },
  async viteFinal(config) {
    const now = performance.now()
    console.log('Integrating Nuxt into Storybook...')
    const { resolvedViteConfig, nuxt } =
      await nuxtViteConfigUtil.integrateNuxtIntoStorybook()
    const { unimportOptions } = await nuxtViteConfigUtil.getNuxtModuleConfigs(nuxt)
    console.log(`...done [${Math.ceil(performance.now() - now)}ms]`)
    const customConfig: InlineConfig = {
      plugins: [
        // Auto-imports managed by unimport
        // TODO: Is this already handled through nuxtViteConfig? Global functions seem to work without this
        Unimport.vite(unimportOptions)
      ],
      define: {
        'process.server': false,
        'process.client': true
      },
      build: {
        sourcemap: false
      }
    }
    let final = mergeConfig(config, resolvedViteConfig)
    final = mergeConfig(final, customConfig)
    return final
  },
  docs: {
    autodocs: true
  }
}
export default config
