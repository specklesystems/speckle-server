import { dirname, join } from 'path'
import type { StorybookConfig } from '@storybook/vue3-vite'
import { get, isObjectLike } from 'lodash'

function getAbsolutePath<V extends string = string>(value: V): V {
  return dirname(require.resolve(join(value, 'package.json'))) as V
}

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions')
  ],
  framework: {
    name: getAbsolutePath('@storybook/vue3-vite'),
    options: {}
  },
  viteFinal(config) {
    // Remove dts plugin, we don't need it and it only causes issues
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    config.plugins = (config.plugins || []).filter(
      (p) => !isObjectLike(p) || get(p, 'name') !== 'vite:dts'
    )
    return config
  }
}
export default config
