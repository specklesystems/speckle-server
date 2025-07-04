import dotenv from 'dotenv'
import { getFeatureFlags } from '@speckle/shared/dist/commonjs/environment/index.js'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
// import commonjs from 'vite-plugin-commonjs'

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
  plugins: [
    tsconfigPaths()
    // commonjs({
    //   filter(id) {
    //     // `node_modules` is exclude by default, so we need to include it explicitly
    //     // https://github.com/vite-plugin/vite-plugin-commonjs/blob/v0.7.0/src/index.ts#L125-L127
    //     if (id.includes('node_modules/knex')) {
    //       console.log(id)
    //       return true
    //     }
    //   }
    // })
  ],
  test: {
    include: [
      'modules/**/*.spec.js',
      'modules/**/*.spec.ts',
      'observability/**/*.spec.ts'
    ],
    ...(exclude.length ? { exclude } : {}),
    setupFiles: ['test/setup.ts'],
    globalSetup: ['test/globalSetup.ts'],
    testTimeout: 150000,
    fileParallelism: false, // TODO: for now, keep it the same way it was w/ mocha,
    globals: true,
    environment: 'node',
    reporters: ['verbose', 'hanging-process'],
    hookTimeout: 10000000, // TODO: while troubleshooting,
    // deps: {
    //   inline: ['knex', /knex/i]
    // },
    // server: {
    //   deps: {
    //     inline: ['knex', /knex/i]
    //   }
    // }
    poolOptions: {
      forks: {
        // this one can theoretically crash vitest worker threads, be careful
        // but its needed to enable worker threads to --import esmLoader & tsx
        execArgv: [...process.execArgv]
      },
      threads: {
        execArgv: [...process.execArgv]
      }
    }
  }
  // optimizeDeps: {
  //   include: ['knex', /knex/i]
  // }
  // resolve: {
  //   alias: {
  //     '@': new URL('./', import.meta.url).pathname
  //   }
  // }
})
