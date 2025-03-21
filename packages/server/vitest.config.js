import dotenv from 'dotenv'
import { getFeatureFlags } from '@speckle/shared/dist/commonjs/environment/index.js'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import commonjs from 'vite-plugin-commonjs'

// Need to init env vars for accurate FF reading
dotenv.config({ path: `./.env.test` })
dotenv.config({ path: `./.env` })

// Resolve FF values for ignore patterns
const featureFlags = getFeatureFlags()
const exclude = [
  ...(!featureFlags.FF_AUTOMATE_MODULE_ENABLED ? ['modules/automate/**/*'] : []),
  ...(!featureFlags.FF_WORKSPACES_MODULE_ENABLED ? ['modules/workspaces/**/*'] : [])
]

export default defineConfig({
  // plugins: [tsconfigPaths(), commonjs()],
  test: {
    include: [
      'modules/**/*.spec.js',
      'modules/**/*.spec.ts',
      'observability/**/*.spec.ts'
    ],
    ...(exclude.length ? { exclude } : {}),
    setupFiles: ['test/hooks.ts'],
    testTimeout: 150000
  }
  // resolve: {
  //   alias: {
  //     '@': new URL('./', import.meta.url).pathname
  //   }
  // }
})
