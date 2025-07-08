import dotenv from 'dotenv'
import { getFeatureFlags } from '@speckle/shared/environment'
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

// duplicate main process argv
const workerExecArgv = ['--import', './esmLoader.js', '--import', 'tsx']
// const workerExecArgv = [...process.execArgv]
// console.log(workerExecArgv)

// Fixing double-load issue where graphql's index.js and index.mjs are both loaded at the same
// time causing various errors like instanceof checks not working.
// Node.js natively loads CJS (.js) version
// Vite importer loads .mjs version, because of the "module" field in package.json
// The proper fix would be a fixed package.json in graphql, but this is a workaround
const graphqlMjsRoot = await import.meta.resolve('graphql')

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
    reporters: ['basic'],
    hookTimeout: 10000000, // TODO: while troubleshooting,
    slowTestThreshold: 1, // TODO: for debugging
    // deps: {
    //   inline: ['knex', /knex/i]
    // },
    // server: {
    //   deps: {
    //     inline: ['knex', /knex/i]
    //   }
    // }
    // TODO: perf troubleshooting
    isolate: false,
    silent: false,
    disableConsoleIntercept: true,
    // pool: 'threads',
    poolOptions: {
      forks: {
        execArgv: workerExecArgv
      },
      threads: {
        execArgv: workerExecArgv
        // isolate: false,
        // singleThread: true
      }
    }
  },
  // optimizeDeps: {
  //   include: ['knex', /knex/i]
  // }
  resolve: {
    alias: {
      graphql: graphqlMjsRoot
    }
  }
})
