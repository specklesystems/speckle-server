import { DEFAULT_EXTENSIONS } from '@babel/core'
import { babel } from '@rollup/plugin-babel'
import image from '@rollup/plugin-image'
import clean from 'rollup-plugin-delete'
import { terser } from 'rollup-plugin-terser'
import typescript2 from 'rollup-plugin-typescript2'
import pkg from './package.json'

const isProd = process.env.NODE_ENV === 'production'
const sourcemap = isProd ? false : 'inline'

/** @type {import('rollup').RollupOptions} */
const config = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap
    },
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap
    }
  ],
  plugins: [
    clean({ targets: 'dist/*' }),
    image(),
    typescript2({
      tsconfigOverride: {
        sourceMap: sourcemap
      }
    }),
    babel({
      extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
      babelHelpers: 'bundled',
      configFile: './babel.config.cjs'
    }),
    ...(isProd ? [terser()] : [])
  ],
  // Externalizing all deps, we don't want to bundle them in cause this is a library
  external: Object.keys(pkg.dependencies || {}).map((d) => new RegExp(`^${d}(\\/.*)?$`))
}

export default config
