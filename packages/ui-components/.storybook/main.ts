import type { StorybookConfig } from '@storybook/vue3-vite'
import { get, isObjectLike } from 'lodash'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions'
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {}
  },
  docs: {
    autodocs: true
  },
  viteFinal(config) {
    // Remove dts plugin, we don't need it and it only causes issues
    config.plugins = (config.plugins || []).filter(
      (p) => !isObjectLike(p) || get(p, 'name') !== 'vite:dts'
    )
    return config
  }
}
export default config
