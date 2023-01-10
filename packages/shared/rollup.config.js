const clean = require('rollup-plugin-delete')
const pkg = require('./package.json')
const typescript2 = require('rollup-plugin-typescript2')

const isProd = process.env.NODE_ENV === 'production'
const sourcemap = isProd ? false : 'inline'

/** @type {import('rollup').RollupOptions} */
module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist-esm/index.js',
      format: 'esm',
      sourcemap
    },
    {
      file: 'dist-cjs/index.js',
      format: 'cjs',
      sourcemap
    }
  ],
  plugins: [
    clean({ targets: ['dist/*', 'dist-esm/*', 'dist-cjs/*'] }),
    typescript2({
      tsconfigOverride: {
        sourceMap: sourcemap
      }
    })
  ],
  // Externalizing all deps, we don't want to bundle them in cause this is a library
  external: Object.keys(pkg.dependencies || {}).map((d) => new RegExp(`^${d}(\\/.*)?$`))
}
