import { terser } from 'rollup-plugin-terser'
import clean from 'rollup-plugin-delete'
import pkg from './package.json'
import typescript2 from 'rollup-plugin-typescript2'
import rebasePlugin from 'rollup-plugin-rebase'
import copyPlugin from 'rollup-plugin-copy'
import { babel } from '@rollup/plugin-babel'
import { DEFAULT_EXTENSIONS } from '@babel/core'

const isProd = process.env.NODE_ENV === 'production'
const sourcemap = isProd ? false : 'inline'

/** @returns {import('rollup').RollupOptions} */
const config = (file, format) => ({
  input: 'src/index.ts',
  output: [
    {
      file,
      format,
      sourcemap
    }
  ],
  plugins: [
    ...(isProd ? [clean({ targets: 'dist/*' })] : []),
    rebasePlugin({ keepName: true }),
    copyPlugin({
      targets: [{ src: './always-bundled-assets/**/*', dest: 'dist/assets' }]
    }),
    typescript2({
      tsconfigOverride: {
        sourceMap: sourcemap
      }
    }),
    babel({
      extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
      babelHelpers: 'bundled'
    }),
    ...(isProd ? [terser()] : [])
  ],
  // Externalizing all deps, we don't want to bundle them in cause this is a library
  external: Object.keys(pkg.dependencies || {}).map((d) => new RegExp(`^${d}(\\/.*)?$`))
})

export default [
  config('dist/speckleviewer.esm.js', 'esm'),
  config('dist/speckleviewer.js', 'cjs')
]
