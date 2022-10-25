import type { StorybookConfig } from '@storybook/builder-vite'
import { mergeConfig, InlineConfig } from 'vite'

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
  viteFinal(config) {
    const final = mergeConfig(config, <InlineConfig>{
      resolve: {
        alias: {
          // not sure why, but storybook tries to bundle "crypto"
          crypto: require.resolve('rollup-plugin-node-builtins')
        }
      }
    })

    return final
  }
}

export default config
