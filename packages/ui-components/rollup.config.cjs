const clean = require('rollup-plugin-delete')
const pkg = require('./package.json')
// const typescript2 = require('rollup-plugin-typescript2')
const typescript = require('@rollup/plugin-typescript')
const vue = require('rollup-plugin-vue')

// const isProd = process.env.NODE_ENV === 'production'
// const sourcemap = isProd ? false : 'inline'
const sourcemap = true

/** @type {import('rollup').RollupOptions} */
const config = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap
    }
  ],
  plugins: [
    clean({ targets: ['dist/*'] }),
    // typescript2({
    //   tsconfigOverride: {
    //     sourceMap: sourcemap
    //   }
    // }),
    vue(),
    typescript()
  ],
  // Externalizing all deps, we don't want to bundle them in cause this is a library
  external: [
    ...Object.keys(pkg.dependencies || {}).map((d) => new RegExp(`^${d}(\\/.*)?$`)),
    ...Object.keys(pkg.peerDependencies || {}).map((d) => new RegExp(`^${d}(\\/.*)?$`))
  ]
}

module.exports = config
